import { Buffer } from "node:buffer";
import { closeSync, fstatSync, openSync, readSync } from "node:fs";

// When a photo or a video was captured, as its own bytes state it
// (photo-path-layout-spec.md R-PHOTO-1, R-PHOTO-6). It reads a JPEG, a PNG, a
// HEIF image such as a HEIC, and a QuickTime or MP4 movie. A file in any other
// format, such as TIFF or a camera's raw format, is no photo or video it reads.

// A capture time a file states: local wall-clock time, as
// `YYYY-MM-DDTHH:MM:SS`, and whether an offset from UTC comes with it.
export type CaptureTime = { wallClock: string; hasOffset: boolean };

// What a photo or a video holds that placing it needs: its capture time,
// where it states one, and its modification time, in milliseconds since
// 1970-01-01T00:00:00Z.
export type MediaHead = {
  captureTime: CaptureTime | undefined;
  mtimeMs: number;
};

// `file`'s head where its bytes show it to be a JPEG, a PNG, a HEIF image, or
// a QuickTime or MP4 movie, and undefined otherwise.
export function readMediaHead(file: string): MediaHead | undefined {
  const descriptor = openSync(file, "r");
  try {
    const { size, mtimeMs } = fstatSync(descriptor);
    if (bytesAt(descriptor, 0, JpegSignature.length).equals(JpegSignature)) {
      const tiff = jpegExifTiff(descriptor);
      return {
        captureTime: tiff === undefined ? undefined : captureTimeIn(tiff),
        mtimeMs,
      };
    }
    if (bytesAt(descriptor, 0, PngSignature.length).equals(PngSignature)) {
      const tiff = pngExifTiff(descriptor, size);
      return {
        captureTime: tiff === undefined ? undefined : captureTimeIn(tiff),
        mtimeMs,
      };
    }

    const boxes = [...boxesIn(descriptor, 0, size)];
    const meta = boxes.find((box) => box.type === "meta");
    const inMeta = meta === undefined ? [] : boxesInMeta(descriptor, meta);
    if (isImageHandler(descriptor, inMeta)) {
      const tiff = unlessCutShort(() => heifExifTiff(descriptor, inMeta));
      return {
        captureTime: tiff === undefined ? undefined : captureTimeIn(tiff),
        mtimeMs,
      };
    }

    const moov = boxes.find((box) => box.type === "moov");
    const inMoov =
      moov === undefined ? [] : [...boxesIn(descriptor, moov.start, moov.end)];
    const mvhd = inMoov.find((box) => box.type === "mvhd");
    if (mvhd !== undefined) {
      return {
        captureTime:
          unlessCutShort(() => appleCreationDate(descriptor, inMoov)) ??
          unlessCutShort(() => movieCreationTime(descriptor, mvhd)),
        mtimeMs,
      };
    }
    return undefined;
  } finally {
    closeSync(descriptor);
  }
}

// Whether `day` of `month` of `year` is a day of a proleptic Gregorian
// calendar (R-PHOTO-4).
export function isCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
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

// Up to `length` bytes of a file open as `descriptor`, from `position`, and
// fewer where that file ends first.
function bytesAt(descriptor: number, position: number, length: number): Buffer {
  const bytes = Buffer.alloc(length);
  return bytes.subarray(0, readSync(descriptor, bytes, 0, length, position));
}

// Largest box, item or chunk this reads whole. Metadata a photo or a movie
// holds is far smaller, so a larger one is passed over rather than held in
// memory.
const LargestRead = 16 * 1024 * 1024;

// Result of `read`, or undefined where it reads past a Buffer's end, as a
// structure cut short, or pointing outside itself, makes it do.
function unlessCutShort<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ERR_OUT_OF_RANGE" && code !== "ERR_BUFFER_OUT_OF_BOUNDS") {
      throw e;
    }
    return undefined;
  }
}

// Wall-clock time, as `YYYY-MM-DDTHH:MM:SS`, of a date and a time whose
// digits `match` holds in its first six groups, from year to second;
// undefined where nothing matched, or where they name no day of a calendar
// and time of that day.
function wallClockOf(match: RegExpExecArray | null): string | undefined {
  const [
    ,
    year = "",
    month = "",
    day = "",
    hour = "",
    minute = "",
    second = "",
  ] = match ?? [];
  if (
    match === null ||
    !isCalendarDate(Number(year), Number(month), Number(day)) ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 60
  ) {
    return undefined;
  }
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

// What a JPEG begins with: SOI's marker, then 0xFF, which begins whichever
// marker follows.
const JpegSignature = Buffer.from([0xff, 0xd8, 0xff]);

// What an APP1 segment that holds Exif begins with.
const ExifHeader = Buffer.from("Exif\0\0", "latin1");

// Exif's TIFF structure in a JPEG open as `descriptor`, from its first APP1
// segment that holds Exif. Each segment before its image data is looked at in
// turn, and a JPEG holding none gives undefined.
function jpegExifTiff(descriptor: number): Buffer | undefined {
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

// What a PNG begins with.
const PngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

// Exif's TIFF structure in a PNG open as `descriptor`, `size` bytes long, from
// its first eXIf chunk, which holds that structure alone; undefined where it
// holds none. Each chunk is its data's length, its type, its data, then a
// checksum of four bytes, and chunks are looked at in turn up to IEND.
function pngExifTiff(descriptor: number, size: number): Buffer | undefined {
  let position = PngSignature.length;
  while (position + 12 <= size) {
    const header = bytesAt(descriptor, position, 8);
    const length = header.readUInt32BE(0);
    const type = header.toString("latin1", 4, 8);
    if (type === "IEND" || position + 12 + length > size) {
      return undefined;
    }
    if (type === "eXIf") {
      return length > LargestRead
        ? undefined
        : bytesAt(descriptor, position + 8, length);
    }
    position += 12 + length;
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

// DateTimeOriginal of TIFF structure `tiff`, which Exif in a JPEG, a PNG or a
// HEIF image holds, and whether OffsetTimeOriginal stands beside it;
// undefined where `tiff` states no DateTimeOriginal that is a date and a time.
// Whatever `tiff` points outside itself is not read.
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
  const wallClock = wallClockOf(
    /^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)$/.exec(
      textOf(exifIfd, DateTimeOriginalTag) ?? "",
    ),
  );
  if (wallClock === undefined) {
    return undefined;
  }
  return {
    wallClock,
    hasOffset: /^[+-]\d\d:\d\d$/.test(
      textOf(exifIfd, OffsetTimeOriginalTag) ?? "",
    ),
  };
}

// A box of an ISO base media file, which a HEIF image and a QuickTime or MP4
// movie each are: its four-character type, and where its content begins and
// ends in that file.
type Box = { type: string; start: number; end: number };

// Each box from `start` up to `end` of a file open as `descriptor`, in turn,
// up to one that does not fit there.
function* boxesIn(
  descriptor: number,
  start: number,
  end: number,
): Generator<Box> {
  let position = start;
  while (position + 8 <= end) {
    const header = bytesAt(descriptor, position, 16);
    if (header.length < 8) {
      return;
    }
    let size = header.readUInt32BE(0);
    let headerLength = 8;
    if (size === 1 && header.length === 16) {
      // A size too large for 32 bits, stated in 64 after its type
      size = Number(header.readBigUInt64BE(8));
      headerLength = 16;
    } else if (size === 0) {
      // A box that runs to wherever whatever holds it ends
      size = end - position;
    }
    if (size < headerLength || position + size > end) {
      return;
    }
    yield {
      type: header.toString("latin1", 4, 8),
      start: position + headerLength,
      end: position + size,
    };
    position += size;
  }
}

// Content of `box` in a file open as `descriptor`, and none where it is larger
// than LargestRead.
function contentOf(descriptor: number, box: Box): Buffer {
  const length = box.end - box.start;
  return length > LargestRead
    ? Buffer.alloc(0)
    : bytesAt(descriptor, box.start, length);
}

// Boxes a `meta` box holds. A HEIF image's is a full box, whose version and
// flags, all zero, come before them; QuickTime's is not, and its first box's
// size stands there instead.
function boxesInMeta(descriptor: number, meta: Box): Box[] {
  const isFullBox = bytesAt(descriptor, meta.start, 4).equals(Buffer.alloc(4));
  return [...boxesIn(descriptor, meta.start + (isFullBox ? 4 : 0), meta.end)];
}

// An unsigned big-endian integer `size` bytes long at `at` in `bytes`, where
// `size` is zero, which gives 0, eight, or one to six.
function uintAt(bytes: Buffer, at: number, size: number): number {
  if (size === 0) {
    return 0;
  }
  return size === 8
    ? Number(bytes.readBigUInt64BE(at))
    : bytes.readUIntBE(at, size);
}

// Whether `inMeta`, boxes that a file's top-level `meta` box holds, name an
// image as that file's content, as a HEIF image's handler box does.
function isImageHandler(descriptor: number, inMeta: Box[]): boolean {
  const hdlr = inMeta.find((box) => box.type === "hdlr");
  // Version and flags, and four bytes more, come before its handler's type.
  return (
    hdlr !== undefined &&
    contentOf(descriptor, hdlr).toString("latin1", 8, 12) === "pict"
  );
}

// Exif's TIFF structure in a HEIF image whose top-level `meta` box holds
// `inMeta`, from its first item of type `Exif` whose bytes stand in that
// image's file; undefined where it holds none.
function heifExifTiff(descriptor: number, inMeta: Box[]): Buffer | undefined {
  const iinf = inMeta.find((box) => box.type === "iinf");
  const iloc = inMeta.find((box) => box.type === "iloc");
  if (iinf === undefined || iloc === undefined) {
    return undefined;
  }
  const extents = extentsOf(
    contentOf(descriptor, iloc),
    exifItemsIn(descriptor, iinf),
  );
  if (
    extents === undefined ||
    extents.reduce((sum, { length }) => sum + length, 0) > LargestRead
  ) {
    return undefined;
  }
  const exif = Buffer.concat(
    extents.map(({ offset, length }) => bytesAt(descriptor, offset, length)),
  );
  // Four bytes stating how many more come before its TIFF structure, such as
  // `Exif\0\0`'s six, or none
  return exif.subarray(4 + exif.readUInt32BE(0));
}

// IDs of items of type `Exif` that item information box `iinf` lists, from
// each of its entries of version 2 or 3, which states its item's type.
function exifItemsIn(descriptor: number, iinf: Box): Set<number> {
  // Version and flags, then a count of entries, in 16 bits at version 0
  const version = bytesAt(descriptor, iinf.start, 1).readUInt8(0);
  const entries = boxesIn(
    descriptor,
    iinf.start + 4 + (version === 0 ? 2 : 4),
    iinf.end,
  );
  const items = new Set<number>();
  for (const infe of entries) {
    const entry = contentOf(descriptor, infe);
    const entryVersion = entry.readUInt8(0);
    if (infe.type !== "infe" || entryVersion < 2) {
      continue;
    }
    // Version and flags, its item's ID, a protection index, then its type
    const idSize = entryVersion === 2 ? 2 : 4;
    const typeAt = 4 + idSize + 2;
    if (entry.toString("latin1", typeAt, typeAt + 4) === "Exif") {
      items.add(uintAt(entry, 4, idSize));
    }
  }
  return items;
}

// Where in its file an item that `items` names stands, as item location box
// `iloc` states it: the first such item whose bytes stand in that same file,
// at offsets in it rather than inside a box.
function extentsOf(
  iloc: Buffer,
  items: Set<number>,
): { offset: number; length: number }[] | undefined {
  const version = iloc.readUInt8(0);
  const hasMethodAndIndex = version === 1 || version === 2;
  // After version and flags, four bits each state how long fields below are.
  const offsetSize = iloc.readUInt8(4) >> 4;
  const lengthSize = iloc.readUInt8(4) & 0xf;
  const baseOffsetSize = iloc.readUInt8(5) >> 4;
  const indexSize = hasMethodAndIndex ? iloc.readUInt8(5) & 0xf : 0;
  const idSize = version < 2 ? 2 : 4;

  let at = 6;
  const next = (size: number): number => {
    const value = uintAt(iloc, at, size);
    at += size;
    return value;
  };
  const itemCount = next(idSize);
  for (let item = 0; item < itemCount; item++) {
    const id = next(idSize);
    // 0 where its bytes stand at offsets in a file
    const constructionMethod = hasMethodAndIndex ? next(2) & 0xf : 0;
    // 0 where that file is this one
    const dataReferenceIndex = next(2);
    const baseOffset = next(baseOffsetSize);
    const extentCount = next(2);
    const extents: { offset: number; length: number }[] = [];
    for (let extent = 0; extent < extentCount; extent++) {
      next(indexSize);
      const offset = baseOffset + next(offsetSize);
      extents.push({ offset, length: next(lengthSize) });
    }
    if (items.has(id) && constructionMethod === 0 && dataReferenceIndex === 0) {
      return extents;
    }
  }
  return undefined;
}

// Key under which an Apple device states when it began recording a movie, as
// local wall-clock time and its offset from UTC, such as
// `2019-07-14T15:30:12+0200`.
const AppleCreationDateKey = "com.apple.quicktime.creationdate";

// Namespace of a key such as AppleCreationDateKey.
const MetadataKeyNamespace = "mdta";

// Type of a metadata value that is UTF-8 text.
const Utf8Type = 1;

// When a movie whose `moov` box holds `inMoov` was captured, as Apple's
// creation date states it; undefined where it states none.
function appleCreationDate(
  descriptor: number,
  inMoov: Box[],
): CaptureTime | undefined {
  const meta = inMoov.find((box) => box.type === "meta");
  const inMeta = meta === undefined ? [] : boxesInMeta(descriptor, meta);
  const keys = inMeta.find((box) => box.type === "keys");
  const ilst = inMeta.find((box) => box.type === "ilst");
  if (keys === undefined || ilst === undefined) {
    return undefined;
  }
  const index = keyIndexOf(contentOf(descriptor, keys), AppleCreationDateKey);
  if (index === undefined) {
    return undefined;
  }
  for (const entry of boxesIn(descriptor, ilst.start, ilst.end)) {
    // An entry's type is its key's index.
    if (Buffer.from(entry.type, "latin1").readUInt32BE(0) !== index) {
      continue;
    }
    for (const data of boxesIn(descriptor, entry.start, entry.end)) {
      const value = contentOf(descriptor, data);
      // Its value's type, then a locale, then that value
      if (data.type === "data" && value.readUInt32BE(0) === Utf8Type) {
        return captureTimeOfText(value.toString("utf8", 8));
      }
    }
  }
  return undefined;
}

// Index, counted from 1, of `key` among keys that key box `keys` lists, and
// undefined where it lists no such key.
function keyIndexOf(keys: Buffer, key: string): number | undefined {
  // Version and flags, then a count of keys. Each key is its length, counting
  // these four bytes, then its namespace, then its text.
  const count = keys.readUInt32BE(4);
  let at = 8;
  for (let index = 1; index <= count; index++) {
    const length = keys.readUInt32BE(at);
    if (
      keys.toString("latin1", at + 4, at + 8) === MetadataKeyNamespace &&
      keys.toString("utf8", at + 8, at + length) === key
    ) {
      return index;
    }
    at += length;
  }
  return undefined;
}

// Capture time that text such as `2019-07-14T15:30:12+0200` states, its offset
// being `+` or `-` and four digits, with or without `:` between hours and
// minutes; undefined where it states no date and time.
function captureTimeOfText(text: string): CaptureTime | undefined {
  const match =
    /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d+)?([+-]\d\d:?\d\d|Z)?$/.exec(
      text,
    );
  const wallClock = wallClockOf(match);
  if (wallClock === undefined) {
    return undefined;
  }
  // `Z` states an instant in UTC, and no offset in force where it was taken.
  return { wallClock, hasOffset: /^[+-]/.test(match?.[7] ?? "") };
}

// Seconds from 1904-01-01T00:00:00Z, from which a movie counts its creation
// time, to 1970-01-01T00:00:00Z.
const SecondsFrom1904To1970 = 2_082_844_800;

// When a movie began, as its movie header box `mvhd` states it: an instant in
// UTC, with no offset in force where it was taken. Undefined where it is zero,
// which a movie whose creation time was never set holds.
function movieCreationTime(
  descriptor: number,
  mvhd: Box,
): CaptureTime | undefined {
  const header = contentOf(descriptor, mvhd);
  // Version and flags, then its creation time, in 64 bits at version 1
  const seconds =
    header.readUInt8(0) === 1
      ? Number(header.readBigUInt64BE(4))
      : header.readUInt32BE(4);
  const created = new Date((seconds - SecondsFrom1904To1970) * 1000);
  if (
    seconds === 0 ||
    Number.isNaN(created.getTime()) ||
    created.getUTCFullYear() > 9999
  ) {
    return undefined;
  }
  return { wallClock: created.toISOString().slice(0, 19), hasOffset: false };
}
