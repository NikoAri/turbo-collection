import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import {
  mkdtempSync,
  realpathSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";

import { isUncertain, photoPlaceOf } from "../photo-path-layout.ts";

// What placing a JPEG reads, written by hand: Exif's TIFF structure, its IFD0
// pointing to an Exif IFD that holds DateTimeOriginal `taken`, and
// OffsetTimeOriginal `offset` where one is given.
function tiffWith(
  taken: string,
  offset: string | undefined,
  isLittleEndian: boolean,
): Buffer {
  const texts = offset === undefined ? [taken] : [taken, offset];
  const exifIfd = 8 + 2 + 12 + 4;
  let data = exifIfd + 2 + 12 * texts.length + 4;
  const tiff = Buffer.alloc(
    data + texts.reduce((sum, text) => sum + text.length + 1, 0),
  );
  const u16 = (at: number, value: number) =>
    isLittleEndian
      ? tiff.writeUInt16LE(value, at)
      : tiff.writeUInt16BE(value, at);
  const u32 = (at: number, value: number) =>
    isLittleEndian
      ? tiff.writeUInt32LE(value, at)
      : tiff.writeUInt32BE(value, at);
  tiff.write(isLittleEndian ? "II" : "MM", 0, "latin1");
  u16(2, 42);
  u32(4, 8);
  // IFD0: one entry, a LONG pointing to its Exif IFD
  u16(8, 1);
  u16(10, 0x8769);
  u16(12, 4);
  u32(14, 1);
  u32(18, exifIfd);
  u16(exifIfd, texts.length);
  for (const [index, text] of texts.entries()) {
    const entry = exifIfd + 2 + 12 * index;
    u16(entry, index === 0 ? 0x9003 : 0x9011);
    u16(entry + 2, 2);
    u32(entry + 4, text.length + 1);
    u32(entry + 8, data);
    tiff.write(`${text}\0`, data, "latin1");
    data += text.length + 1;
  }
  return tiff;
}

// A segment of a JPEG: its marker, then `payload` after its length.
function segment(marker: number, payload: Buffer): Buffer {
  const header = Buffer.from([0xff, marker, 0, 0]);
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([header, payload]);
}

// A JPEG holding no image: SOI, then `segments`, then EOI.
function jpegOf(...segments: Buffer[]): Buffer {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    ...segments,
    Buffer.from([0xff, 0xd9]),
  ]);
}

// An APP1 segment holding Exif's TIFF structure `tiff`.
function exifSegmentOf(tiff: Buffer): Buffer {
  return segment(0xe1, Buffer.concat([Buffer.from("Exif\0\0"), tiff]));
}

// A JPEG whose Exif states DateTimeOriginal `taken`, with OffsetTimeOriginal
// `offset` where given, in big-endian byte order unless `isLittleEndian`.
function jpegTaken(
  taken: string,
  offset?: string,
  isLittleEndian = false,
): Buffer {
  return jpegOf(exifSegmentOf(tiffWith(taken, offset, isLittleEndian)));
}

// A new, empty directory under `tmpdir()`, removed when test `t` ends.
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// Where photo-path layout places `content`, written as a file named `name`,
// from Import Source `local-folder`.
function placeOf(t: TestContext, name: string, content: Buffer | string) {
  const file = path.join(temporaryDirectory(t), name);
  writeFileSync(file, content);
  return photoPlaceOf(file, name, "local-folder");
}

test("R-PHOTO-3, R-PHOTO-4, R-PHOTO-6: a JPEG goes to <YYYY>/<YYYY>-<MM>/<import source> by its Exif DateTimeOriginal, in either byte order", (t) => {
  for (const isLittleEndian of [false, true]) {
    assert.deepEqual(
      placeOf(
        t,
        "DSC_0001.JPG",
        jpegTaken("2019:07:14 15:30:12", "+02:00", isLittleEndian),
      ),
      {
        directory: "2019/2019-07/local-folder",
        governingTimestamp: "2019-07-14T15:30:12",
        readFrom: "capture time",
      },
    );
  }
});

test("R-PHOTO-7: a JPEG is placed by its local wall-clock time, not by that time in UTC", (t) => {
  // In UTC this photo was taken on 2019-12-31.
  const place = placeOf(
    t,
    "IMG_0187.JPG",
    jpegTaken("2020:01:01 00:15:00", "+02:00"),
  );

  assert.equal(place?.directory, "2020/2020-01/local-folder");
});

test("R-PHOTO-8: a capture time stated with an offset is certain, and one stated with none is uncertain", (t) => {
  const withOffset = placeOf(
    t,
    "a.jpg",
    jpegTaken("2018:05:20 08:00:00", "-05:00"),
  );
  const withNone = placeOf(t, "b.jpg", jpegTaken("2018:05:20 08:00:00"));

  assert.equal(isUncertain(withOffset!), false);
  assert.equal(withNone?.readFrom, "capture time with no offset");
  assert.equal(isUncertain(withNone!), true);
  assert.equal(withNone?.directory, "2018/2018-05/local-folder");
});

test("R-PHOTO-1: a JPEG is told by its bytes whatever its name, and another file is not placed whatever its name", (t) => {
  assert.equal(
    placeOf(t, "photo.txt", jpegTaken("2019:07:14 15:30:12", "+02:00"))
      ?.directory,
    "2019/2019-07/local-folder",
  );
  assert.equal(placeOf(t, "IMG_0001.JPG", "a text, not a JPEG"), undefined);
  assert.equal(placeOf(t, "empty.jpg", ""), undefined);
});

test("R-PHOTO-6: Exif is found after other segments, such as an APP0 segment and an APP1 segment holding XMP, and past a fill byte", (t) => {
  const app0 = segment(0xe0, Buffer.alloc(14));
  const xmp = segment(0xe1, Buffer.from("http://ns.adobe.com/xap/1.0/\0<x/>"));
  const exif = exifSegmentOf(tiffWith("2019:07:14 15:30:12", "+02:00", true));
  const fill = Buffer.from([0xff]);

  assert.equal(
    placeOf(t, "a.jpg", jpegOf(app0, xmp, fill, exif))?.governingTimestamp,
    "2019-07-14T15:30:12",
  );
});

test("R-PHOTO-6, R-PHOTO-8: with no capture time, a JPEG is placed by a date its filename states, which is uncertain", (t) => {
  for (const [name, directory, governingTimestamp] of [
    ["IMG_20190714_153012.jpg", "2019/2019-07/local-folder", "2019-07-14"],
    ["IMG-20210305-WA0003.jpg", "2021/2021-03/local-folder", "2021-03-05"],
    ["2019-07-14 15.30.12.jpg", "2019/2019-07/local-folder", "2019-07-14"],
    ["IMG_20231399_20220810.jpg", "2022/2022-08/local-folder", "2022-08-10"],
  ] as const) {
    assert.deepEqual(placeOf(t, name, jpegOf()), {
      directory,
      governingTimestamp,
      readFrom: "filename",
    });
  }
});

test("R-PHOTO-6, R-PHOTO-7, R-PHOTO-8: with no date in its Exif or its name, a JPEG is placed by its modification time, read in UTC, which is uncertain", (t) => {
  const directory = temporaryDirectory(t);
  // At 23:30 UTC, it is already April in any time zone east of UTC.
  const modified = new Date("2017-03-31T23:30:00Z");
  for (const name of [
    "IMG_0101.JPG",
    "P1010001.JPG",
    "IMG_20190230.jpg",
    "IMG_201907140.jpg",
  ]) {
    const file = path.join(directory, name);
    writeFileSync(file, jpegOf());
    utimesSync(file, modified, modified);

    assert.deepEqual(photoPlaceOf(file, name, "local-folder"), {
      directory: "2017/2017-03/local-folder",
      governingTimestamp: "2017-03-31T23:30:00",
      readFrom: "modification time",
    });
  }
});

test("R-PHOTO-6: a DateTimeOriginal that is no date and time, such as a camera with no clock set writes, is passed over", (t) => {
  for (const taken of [
    "0000:00:00 00:00:00",
    "    :  :     :  :  ",
    "2019:02:29 10:00:00",
    "2019:07:14 24:00:00",
    "2019-07-14 15:30:12",
  ]) {
    assert.equal(
      placeOf(t, "IMG_20210305.jpg", jpegTaken(taken))?.readFrom,
      "filename",
    );
  }
});

test("R-PHOTO-6: an Exif structure cut short, or pointing outside itself, is passed over", (t) => {
  const whole = tiffWith("2019:07:14 15:30:12", "+02:00", false);
  const pointingOutside = Buffer.from(whole);
  pointingOutside.writeUInt32BE(0xffff, 18);
  for (const tiff of [whole.subarray(0, 30), pointingOutside]) {
    assert.equal(
      placeOf(t, "IMG_20210305.jpg", jpegOf(exifSegmentOf(tiff)))?.readFrom,
      "filename",
    );
  }
});

test("R-SRC-26: a file that cannot be read is not placed by photo-path layout", (t) => {
  const missing = path.join(temporaryDirectory(t), "gone.jpg");

  assert.equal(photoPlaceOf(missing, "gone.jpg", "local-folder"), undefined);
});
