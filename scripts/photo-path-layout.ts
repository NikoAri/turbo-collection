import { Buffer } from "node:buffer";
import { closeSync, fstatSync, openSync, readSync } from "node:fs";

// Photo-path layout (photo-path-layout-spec.md): which files it places, and in
// which directory each goes, by a date read from that file.
//
// It reads JPEG alone so far, so a photo or video in any other format is not
// one it places.

// What a governing timestamp was read from (R-PHOTO-6). Each but
// `capture time` gives an uncertain date (R-PHOTO-8).
export type ReadFrom =
  | "capture time"
  | "capture time with no offset"
  | "filename"
  | "modification time";

// Where photo-path layout places a file, and by which date.
export type PhotoPlace = {
  // `<YYYY>/<YYYY>-<MM>/<import source>`, relative to a TC Directory, with `/`
  // between its segments (R-PHOTO-3, R-PHOTO-4)
  directory: string;
  // Governing timestamp, in local wall-clock time, as `YYYY-MM-DDTHH:MM:SS`,
  // or as `YYYY-MM-DD` where only a date was read (R-PHOTO-6, R-PHOTO-7)
  governingTimestamp: string;
  readFrom: ReadFrom;
};

// Whether `place` holds an uncertain date (R-PHOTO-8).
export function isUncertain(place: PhotoPlace): boolean {
  return place.readFrom !== "capture time";
}

// Where photo-path layout places a file read from `file`, whose Supplied
// filename is `suppliedName`, from Import Source `importSource`. Undefined
// where `file` is not a JPEG (R-PHOTO-1), or cannot be read.
export function photoPlaceOf(
  file: string,
  suppliedName: string,
  importSource: string,
): PhotoPlace | undefined {
  let head: JpegHead | undefined;
  try {
    head = readJpegHead(file);
  } catch (e) {
    // Only a failed system call, such as a file that is gone or locked
    if (typeof (e as NodeJS.ErrnoException).syscall !== "string") {
      throw e;
    }
    return undefined;
  }
  if (head === undefined) {
    return undefined;
  }
  const { governingTimestamp, readFrom } = governingTimestampOf(
    head,
    suppliedName,
  );
  const year = governingTimestamp.slice(0, 4);
  const month = governingTimestamp.slice(5, 7);
  return {
    directory: `${year}/${year}-${month}/${importSource}`,
    governingTimestamp,
    readFrom,
  };
}

// A governing timestamp of a JPEG whose head is `head` and whose Supplied
// filename is `suppliedName`, from whichever comes first (R-PHOTO-6): Exif's
// DateTimeOriginal, which states local wall-clock time; a date that filename
// states; or that JPEG's modification time. A modification time is an
// instant, read in UTC, since a machine's own time zone is not that photo's
// (R-PHOTO-7).
function governingTimestampOf(
  head: JpegHead,
  suppliedName: string,
): { governingTimestamp: string; readFrom: ReadFrom } {
  const captureTime =
    head.tiff === undefined ? undefined : captureTimeIn(head.tiff);
  if (captureTime !== undefined) {
    return {
      governingTimestamp: captureTime.wallClock,
      readFrom: captureTime.hasOffset
        ? "capture time"
        : "capture time with no offset",
    };
  }
  const named = dateInName(suppliedName);
  if (named !== undefined) {
    return { governingTimestamp: named, readFrom: "filename" };
  }
  return {
    governingTimestamp: new Date(head.mtimeMs).toISOString().slice(0, 19),
    readFrom: "modification time",
  };
}

// A date a filename states: a year from 1900 to 2099, then its month and its
// day, written together or each set off by one same `-`, `_` or `.`, with no
// digit just before or after it, as in `IMG_20190714_153012.jpg` or
// `2019-07-14 15.30.12.jpg`.
const DateInName = /(?<!\d)((?:19|20)\d\d)([-_.]?)(\d\d)\2(\d\d)(?!\d)/g;

// First date `name` states that is a day of a calendar, as `YYYY-MM-DD`.
function dateInName(name: string): string | undefined {
  for (const [, year = "", , month = "", day = ""] of name.matchAll(
    DateInName,
  )) {
    if (isCalendarDate(Number(year), Number(month), Number(day))) {
      return `${year}-${month}-${day}`;
    }
  }
  return undefined;
}

// Whether `day` of `month` of `year` is a day of a proleptic Gregorian
// calendar (R-PHOTO-4).
function isCalendarDate(year: number, month: number, day: number): boolean {
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  const days = daysInMonth[month - 1];
  return year >= 1 && days !== undefined && day >= 1 && day <= days;
}

// What a JPEG's start holds that placing it needs: Exif's TIFF structure,
// where it holds one, and its modification time, in milliseconds since
// 1970-01-01T00:00:00Z.
type JpegHead = { tiff: Buffer | undefined; mtimeMs: number };

// What a JPEG begins with: SOI's marker, then 0xFF, which begins whichever
// marker follows.
const JpegSignature = Buffer.from([0xff, 0xd8, 0xff]);

// `file`'s head where `file` begins as a JPEG does, and undefined otherwise.
function readJpegHead(file: string): JpegHead | undefined {
  const descriptor = openSync(file, "r");
  try {
    const signature = Buffer.alloc(JpegSignature.length);
    const bytesRead = readSync(descriptor, signature, 0, signature.length, 0);
    if (bytesRead < signature.length || !signature.equals(JpegSignature)) {
      return undefined;
    }
    return {
      tiff: exifTiffIn(descriptor),
      mtimeMs: fstatSync(descriptor).mtimeMs,
    };
  } finally {
    closeSync(descriptor);
  }
}

// What an APP1 segment that holds Exif begins with.
const ExifHeader = Buffer.from("Exif\0\0", "latin1");

// Exif's TIFF structure in a JPEG open as `descriptor`, from its first APP1
// segment that holds Exif. Each segment before its image data is looked at in
// turn, and a JPEG holding none gives undefined.
function exifTiffIn(descriptor: number): Buffer | undefined {
  const marker = Buffer.alloc(4);
  // SOI's two bytes come first, and a marker begins each segment after them.
  let position = 2;
  while (readSync(descriptor, marker, 0, marker.length, position) === 4) {
    const [first, code] = marker;
    if (first !== 0xff || code === 0xda || code === 0xd9) {
      // Not a marker, or image data or its end, with no Exif before it
      return undefined;
    }
    if (code === 0xff) {
      // A fill byte, which may stand before a marker
      position += 1;
      continue;
    }
    const length = marker.readUInt16BE(2);
    if (code === 0xe1 && length >= 2 + ExifHeader.length) {
      const segment = Buffer.alloc(length - 2);
      const bytesRead = readSync(
        descriptor,
        segment,
        0,
        segment.length,
        position + marker.length,
      );
      if (
        bytesRead === segment.length &&
        segment.subarray(0, ExifHeader.length).equals(ExifHeader)
      ) {
        return segment.subarray(ExifHeader.length);
      }
    }
    // A marker's two bytes, then a segment whose length counts its own two
    position += 2 + length;
  }
  return undefined;
}

// Exif tags this reads: IFD0's pointer to its Exif IFD, and in that IFD,
// when a photo was taken by its own clock, and that clock's offset from UTC.
const ExifIfdPointerTag = 0x8769;
const DateTimeOriginalTag = 0x9003;
const OffsetTimeOriginalTag = 0x9011;

// TIFF's type for ASCII text.
const AsciiType = 2;

// A capture time Exif states: local wall-clock time, as
// `YYYY-MM-DDTHH:MM:SS`, and whether an offset from UTC comes with it.
type CaptureTime = { wallClock: string; hasOffset: boolean };

// DateTimeOriginal of TIFF structure `tiff`, and whether OffsetTimeOriginal
// stands beside it; undefined where `tiff` states no DateTimeOriginal that is
// a date and a time. Whatever `tiff` points outside itself is not read.
function captureTimeIn(tiff: Buffer): CaptureTime | undefined {
  const byteOrder = tiff.toString("latin1", 0, 2);
  if (tiff.length < 8 || (byteOrder !== "II" && byteOrder !== "MM")) {
    return undefined;
  }
  const isLittleEndian = byteOrder === "II";
  const u16 = (at: number) =>
    isLittleEndian ? tiff.readUInt16LE(at) : tiff.readUInt16BE(at);
  const u32 = (at: number) =>
    isLittleEndian ? tiff.readUInt32LE(at) : tiff.readUInt32BE(at);

  // Where an IFD at `ifd` holds an entry for `tag`, each entry being 12 bytes
  const entryOf = (ifd: number, tag: number): number | undefined => {
    if (ifd + 2 > tiff.length) {
      return undefined;
    }
    const count = u16(ifd);
    for (let index = 0; index < count; index++) {
      const entry = ifd + 2 + index * 12;
      if (entry + 12 > tiff.length) {
        return undefined;
      }
      if (u16(entry) === tag) {
        return entry;
      }
    }
    return undefined;
  };

  // Text of an IFD at `ifd` for `tag`, without its closing NULs
  const textOf = (ifd: number, tag: number): string | undefined => {
    const entry = entryOf(ifd, tag);
    if (entry === undefined || u16(entry + 2) !== AsciiType) {
      return undefined;
    }
    const count = u32(entry + 4);
    // Four bytes or fewer stand in their entry, and more stand where it points.
    const start = count <= 4 ? entry + 8 : u32(entry + 8);
    if (start + count > tiff.length) {
      return undefined;
    }
    return tiff.toString("latin1", start, start + count).replace(/\0+$/, "");
  };

  if (u16(2) !== 42) {
    return undefined;
  }
  const pointer = entryOf(u32(4), ExifIfdPointerTag);
  if (pointer === undefined) {
    return undefined;
  }
  const exifIfd = u32(pointer + 8);
  const taken = /^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)$/.exec(
    textOf(exifIfd, DateTimeOriginalTag) ?? "",
  );
  const [
    ,
    year = "",
    month = "",
    day = "",
    hour = "",
    minute = "",
    second = "",
  ] = taken ?? [];
  if (
    taken === null ||
    !isCalendarDate(Number(year), Number(month), Number(day)) ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 60
  ) {
    return undefined;
  }
  return {
    wallClock: `${year}-${month}-${day}T${hour}:${minute}:${second}`,
    hasOffset: /^[+-]\d\d:\d\d$/.test(
      textOf(exifIfd, OffsetTimeOriginalTag) ?? "",
    ),
  };
}
