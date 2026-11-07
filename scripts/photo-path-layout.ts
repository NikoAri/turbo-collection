import {
  isCalendarDate,
  readMediaHead,
  type MediaHead,
} from "./capture-times.ts";

// Photo-path layout (photo-path-layout-spec.md): which files it places, and in
// which directory each goes, by a date read from that file.
//
// It places a JPEG, a PNG, a HEIF image and a QuickTime or MP4 movie so far,
// which `readMediaHead` reads, so a photo or video in any other format is not
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
// where `file` is no photo or video `readMediaHead` reads (R-PHOTO-1), or
// cannot be read.
export function photoPlaceOf(
  file: string,
  suppliedName: string,
  importSource: string,
): PhotoPlace | undefined {
  let head: MediaHead | undefined;
  try {
    head = readMediaHead(file);
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

// A governing timestamp of a photo or a video whose head is `head` and whose
// Supplied filename is `suppliedName`, from whichever comes first
// (R-PHOTO-6): a capture time it states; a date that filename states; or its
// modification time. A modification time is an instant, read in UTC, since a
// machine's own time zone is not that photo's (R-PHOTO-7).
function governingTimestampOf(
  head: MediaHead,
  suppliedName: string,
): { governingTimestamp: string; readFrom: ReadFrom } {
  const { captureTime } = head;
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
