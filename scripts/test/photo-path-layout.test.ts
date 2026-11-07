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
import { crc32, deflateSync } from "node:zlib";

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

// `value` as an unsigned big-endian integer `size` bytes long.
function uint(value: number, size: 2 | 4 | 8): Buffer {
  const bytes = Buffer.alloc(size);
  if (size === 8) {
    bytes.writeBigUInt64BE(BigInt(value));
  } else {
    bytes.writeUIntBE(value, 0, size);
  }
  return bytes;
}

// A PNG chunk: its data's length, its type `type`, `data`, then a checksum of
// that type and data.
function chunk(type: string, data: Buffer): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, "latin1"), data]);
  return Buffer.concat([
    uint(data.length, 4),
    typeAndData,
    uint(crc32(typeAndData), 4),
  ]);
}

// A one-pixel gray PNG, with an eXIf chunk holding Exif's TIFF structure
// `tiff` where given, before its image data unless `isExifLast`.
function pngOf(tiff?: Buffer, isExifLast = false): Buffer {
  const header = Buffer.concat([
    uint(1, 4),
    uint(1, 4),
    Buffer.from([8, 0, 0, 0, 0]),
  ]);
  const image = chunk("IDAT", deflateSync(Buffer.from([0, 0x80])));
  const exif = tiff === undefined ? [] : [chunk("eXIf", tiff)];
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    ...(isExifLast ? [image, ...exif] : [...exif, image]),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// A box of an ISO base media file: its size and its type `type`, then
// `content`.
function box(type: string, ...content: Buffer[]): Buffer {
  const body = Buffer.concat(content);
  return Buffer.concat([
    uint(8 + body.length, 4),
    Buffer.from(type, "latin1"),
    body,
  ]);
}

// A full box: a box whose content begins with version `version` and flags of
// zero.
function fullBox(type: string, version: number, ...content: Buffer[]): Buffer {
  return box(type, Buffer.from([version, 0, 0, 0]), ...content);
}

// A handler box naming its content's type as `handler`.
function handlerBox(handler: string): Buffer {
  return fullBox(
    "hdlr",
    0,
    uint(0, 4),
    Buffer.from(handler, "latin1"),
    Buffer.alloc(12),
    Buffer.from("\0"),
  );
}

// A HEIF image, written by hand, whose item 1 is an image of four bytes and
// whose item 2 is Exif item `exif`, each located by an item location box of
// version `ilocVersion`.
function heifOf(exif: Buffer, ilocVersion: 0 | 1): Buffer {
  const ftyp = box(
    "ftyp",
    Buffer.from("heic"),
    uint(0, 4),
    Buffer.from("mif1"),
  );
  const image = Buffer.alloc(4);
  // One item's location, as one extent. Version 1 adds a construction method
  // and here puts that extent's offset in its base offset.
  const location = (id: number, offset: number, length: number) =>
    ilocVersion === 0
      ? Buffer.concat([
          uint(id, 2),
          uint(0, 2),
          uint(1, 2),
          uint(offset, 4),
          uint(length, 4),
        ])
      : Buffer.concat([
          uint(id, 2),
          uint(0, 2),
          uint(0, 2),
          uint(offset, 4),
          uint(1, 2),
          uint(0, 4),
          uint(length, 4),
        ]);
  const metaWith = (dataStart: number) =>
    fullBox(
      "meta",
      0,
      handlerBox("pict"),
      fullBox(
        "iinf",
        0,
        uint(2, 2),
        fullBox("infe", 2, uint(1, 2), uint(0, 2), Buffer.from("hvc1\0")),
        fullBox("infe", 2, uint(2, 2), uint(0, 2), Buffer.from("Exif\0")),
      ),
      fullBox(
        "iloc",
        ilocVersion,
        // Offsets and lengths of four bytes, and a base offset of four at
        // version 1
        Buffer.from([0x44, ilocVersion === 0 ? 0x00 : 0x40]),
        uint(2, 2),
        location(1, dataStart, image.length),
        location(2, dataStart + image.length, exif.length),
      ),
    );
  // Where mdat's content begins, after a `meta` box whose length no offset
  // in it changes
  const dataStart = ftyp.length + metaWith(0).length + 8;
  return Buffer.concat([ftyp, metaWith(dataStart), box("mdat", image, exif)]);
}

// A HEIF image whose Exif states DateTimeOriginal `taken`, with
// OffsetTimeOriginal `offset` where given, and `Exif\0\0` before its TIFF
// structure where `hasExifHeader`.
function heifTaken(
  taken: string,
  offset: string | undefined,
  ilocVersion: 0 | 1,
  hasExifHeader: boolean,
): Buffer {
  const tiff = tiffWith(taken, offset, false);
  return heifOf(
    hasExifHeader
      ? Buffer.concat([uint(6, 4), Buffer.from("Exif\0\0"), tiff])
      : Buffer.concat([uint(0, 4), tiff]),
    ilocVersion,
  );
}

// Seconds from 1904-01-01T00:00:00Z, from which a movie counts its creation
// time, to instant `iso`.
function secondsSince1904(iso: string): number {
  return Date.parse(iso) / 1000 + 2_082_844_800;
}

// A QuickTime movie, written by hand and holding no frames: a media data box
// whose header states its size in 64 bits, then a `moov` box. Its movie header
// box, of version `mvhdVersion`, states creation time `created`, in seconds
// since 1904. Where `appleKeys` is given, its `meta` box lists each key and
// value of it, and is a full box where `isFullMeta`.
function movieOf(
  created: number,
  appleKeys: [string, string][] = [],
  mvhdVersion: 0 | 1 = 0,
  isFullMeta = false,
): Buffer {
  const ftyp = box(
    "ftyp",
    Buffer.from("qt  "),
    uint(0, 4),
    Buffer.from("qt  "),
  );
  const mdat = Buffer.concat([
    uint(1, 4),
    Buffer.from("mdat"),
    uint(16 + 4, 8),
    Buffer.alloc(4),
  ]);
  const mvhd = fullBox(
    "mvhd",
    mvhdVersion,
    mvhdVersion === 0
      ? Buffer.concat([uint(created, 4), uint(created, 4), uint(600, 4)])
      : Buffer.concat([uint(created, 8), uint(created, 8), uint(600, 4)]),
    Buffer.alloc(88),
  );
  const keys = fullBox(
    "keys",
    0,
    uint(appleKeys.length, 4),
    ...appleKeys.map(([key]) =>
      Buffer.concat([
        uint(8 + Buffer.byteLength(key), 4),
        Buffer.from("mdta"),
        Buffer.from(key),
      ]),
    ),
  );
  // Each entry's type is its key's index, counted from 1.
  const ilst = box(
    "ilst",
    ...appleKeys.map(([, value], index) =>
      box(
        uint(index + 1, 4).toString("latin1"),
        box("data", uint(1, 4), uint(0, 4), Buffer.from(value)),
      ),
    ),
  );
  const metaContent = [handlerBox("mdta"), keys, ilst];
  const meta = isFullMeta
    ? fullBox("meta", 0, ...metaContent)
    : box("meta", ...metaContent);
  return Buffer.concat([
    ftyp,
    mdat,
    box("moov", mvhd, ...(appleKeys.length === 0 ? [] : [meta])),
  ]);
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

test("R-PHOTO-1, R-PHOTO-6: a HEIF image goes by its Exif DateTimeOriginal, at either version of item location box, with or without `Exif\\0\\0` before its TIFF structure", (t) => {
  for (const ilocVersion of [0, 1] as const) {
    for (const hasExifHeader of [false, true]) {
      assert.deepEqual(
        placeOf(
          t,
          "IMG_4021.HEIC",
          heifTaken(
            "2019:07:14 15:30:12",
            "+02:00",
            ilocVersion,
            hasExifHeader,
          ),
        ),
        {
          directory: "2019/2019-07/local-folder",
          governingTimestamp: "2019-07-14T15:30:12",
          readFrom: "capture time",
        },
      );
    }
  }
});

test("R-PHOTO-8: a HEIF image whose Exif states no offset is uncertain", (t) => {
  const place = placeOf(
    t,
    "IMG_4022.HEIC",
    heifTaken("2018:05:20 08:00:00", undefined, 1, true),
  );

  assert.equal(place?.readFrom, "capture time with no offset");
  assert.equal(place?.directory, "2018/2018-05/local-folder");
});

test("R-PHOTO-6: a HEIF image whose Exif item is cut short, or holds no TIFF structure, goes by a date its filename states", (t) => {
  for (const exif of [Buffer.alloc(2), uint(0, 4)]) {
    assert.equal(
      placeOf(t, "IMG_20210305_101010.HEIC", heifOf(exif, 0))?.readFrom,
      "filename",
    );
  }
});

test("R-PHOTO-1, R-PHOTO-6: a movie goes by Apple's creation date, which states its offset, before its movie header's creation time, past a box whose size takes 64 bits", (t) => {
  for (const isFullMeta of [false, true]) {
    for (const creationDate of [
      "2019-07-14T15:30:12+0200",
      "2019-07-14T15:30:12+02:00",
    ]) {
      const movie = movieOf(
        secondsSince1904("2001-01-01T00:00:00Z"),
        [
          ["com.apple.quicktime.make", "Apple"],
          ["com.apple.quicktime.creationdate", creationDate],
        ],
        0,
        isFullMeta,
      );

      assert.deepEqual(placeOf(t, "IMG_4021.MOV", movie), {
        directory: "2019/2019-07/local-folder",
        governingTimestamp: "2019-07-14T15:30:12",
        readFrom: "capture time",
      });
    }
  }
});

test("R-PHOTO-6, R-PHOTO-7, R-PHOTO-8: with no Apple creation date, a movie goes by its movie header's creation time, an instant in UTC read as it stands, which is uncertain", (t) => {
  // At 23:30 UTC, it is already August in any time zone east of UTC.
  const created = secondsSince1904("2019-07-31T23:30:00Z");
  for (const mvhdVersion of [0, 1] as const) {
    assert.deepEqual(
      placeOf(t, "MVI_0042.MP4", movieOf(created, [], mvhdVersion)),
      {
        directory: "2019/2019-07/local-folder",
        governingTimestamp: "2019-07-31T23:30:00",
        readFrom: "capture time with no offset",
      },
    );
  }
});

test("R-PHOTO-8: Apple's creation date stated in UTC, with `Z`, states no offset, and is uncertain", (t) => {
  const movie = movieOf(0, [
    ["com.apple.quicktime.creationdate", "2019-07-14T13:30:12Z"],
  ]);

  assert.deepEqual(placeOf(t, "IMG_4021.MOV", movie), {
    directory: "2019/2019-07/local-folder",
    governingTimestamp: "2019-07-14T13:30:12",
    readFrom: "capture time with no offset",
  });
});

test("R-PHOTO-6: a movie whose Apple metadata is cut short goes by its movie header's creation time, and one whose creation time was never set by its filename", (t) => {
  const cutShort = movieOf(secondsSince1904("2019-07-14T13:30:12Z"), [
    ["com.apple.quicktime.make", "Apple"],
    ["com.apple.quicktime.creationdate", "2019-07-14T15:30:12+0200"],
  ]);
  // Its first key's length runs past its key box's end.
  cutShort.writeUInt32BE(0xffff, cutShort.indexOf("keys") + 12);

  assert.equal(
    placeOf(t, "IMG_4021.MOV", cutShort)?.readFrom,
    "capture time with no offset",
  );
  assert.equal(
    placeOf(t, "VID_20210305_101010.mp4", movieOf(0))?.readFrom,
    "filename",
  );
});

test("R-PHOTO-1, R-PHOTO-6: a PNG goes by its eXIf chunk's DateTimeOriginal, before or after its image data", (t) => {
  for (const isExifLast of [false, true]) {
    assert.deepEqual(
      placeOf(
        t,
        "IMG_0420.PNG",
        pngOf(tiffWith("2022:02:20 14:00:00", "+01:00", false), isExifLast),
      ),
      {
        directory: "2022/2022-02/local-folder",
        governingTimestamp: "2022-02-20T14:00:00",
        readFrom: "capture time",
      },
    );
  }
});

test("R-PHOTO-6: a PNG with no eXIf chunk, or one cut short, goes by a date its filename states", (t) => {
  const whole = pngOf(tiffWith("2022:02:20 14:00:00", "+01:00", false));
  for (const png of [pngOf(), whole.subarray(0, 40)]) {
    assert.deepEqual(placeOf(t, "Screenshot_20210305-101010.png", png), {
      directory: "2021/2021-03/local-folder",
      governingTimestamp: "2021-03-05",
      readFrom: "filename",
    });
  }
});

test("R-SRC-26: a file that cannot be read is not placed by photo-path layout", (t) => {
  const missing = path.join(temporaryDirectory(t), "gone.jpg");

  assert.equal(photoPlaceOf(missing, "gone.jpg", "local-folder"), undefined);
});
