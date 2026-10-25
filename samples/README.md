# Samples

[`tc-sample-main`](tc-sample-main/) and
[`tc-sample-off-site`](tc-sample-off-site/) are copies of one sample collection.
[`logs/`](logs/) holds the log of the init run that made `tc-sample-main`, as it
would sit in the temporary directory of the computer that ran it, never in a
copy.

[`moon-laptop`](moon-laptop/) is a directory to import from. Imported into a new
copy, it fills `local-folder/moon-laptop/` with files and manifest entries
matching `tc-sample-main`'s.

[`moon-photos`](moon-photos/) is a directory of photos to import and sort by
date. Each is a one-pixel JPEG holding its date as a phone, a camera or an app
writes it:

| File                               | Date inside it                     | Photo layout files it in     |
| ---------------------------------- | ---------------------------------- | ---------------------------- |
| `phone/IMG_0101.JPG`               | 2019-07-14 15:30:12, offset +02:00 | `2019/2019-07/local-folder/` |
| `phone/IMG_0102.JPG`               | 2019-07-15 09:05:40, offset +02:00 | `2019/2019-07/local-folder/` |
| `phone/IMG_0187.JPG`               | 2020-01-01 00:15:00, offset +02:00 | `2020/2020-01/local-folder/` |
| `camera/DSC_0042.JPG`              | 2018-05-20 08:00:00, no offset     | `2018/2018-05/local-folder/` |
| `whatsapp/IMG-20210305-WA0003.jpg` | none; its name says 2021-03-05     | `2021/2021-03/local-folder/` |

In UTC, `IMG_0187.JPG` was taken in December 2019. It is filed by its local
time, as [R-PHOTO-7](../specs/layouts/photo-path-layout-spec.md) requires.
