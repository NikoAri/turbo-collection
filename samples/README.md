# Samples

[`tc-sample-main`](tc-sample-main/) and
[`tc-sample-off-site`](tc-sample-off-site/) are TC Copies of one sample
collection. [`logs/`](logs/) holds the log of the init run that made
`tc-sample-main`, as it would sit in the temporary directory of the computer
that ran it, never in a TC Copy.

[`moon-laptop`](moon-laptop/) is a directory to import from. Imported into a new
TC Copy, it fills `local-folder/moon-laptop/` with files and manifest entries
matching `tc-sample-main`'s.

[`moon-photos`](moon-photos/) is a directory of photos and a video to import and
sort by date. Each holds its date as a phone, a camera or an app writes it: an
8x8 JPEG, a 17x32 PNG, a 64x64 HEIC, or an 8x8 QuickTime movie of two frames
lasting two seconds. Each JPEG is a picture in shades of one color, which tells
it apart once imported. `IMG_0301.HEIC` and `IMG_0301.MOV` are a still and its
movie, as an iPhone pairs them, of a purple creature jumping, and `IMG_0420.PNG`
is a screenshot of a photo library holding the other pictures. Each file is
about a kilobyte at most, and Windows' own decoders read each.

| File                               | Picture                   | Date inside it                     | Photo layout files it in     |
| ---------------------------------- | ------------------------- | ---------------------------------- | ---------------------------- |
| `phone/IMG_0101.JPG`               | red heart                 | 2019-07-14 15:30:12, offset +02:00 | `2019/2019-07/local-folder/` |
| `phone/IMG_0102.JPG`               | orange cat                | 2019-07-15 09:05:40, offset +02:00 | `2019/2019-07/local-folder/` |
| `phone/IMG_0187.JPG`               | yellow smiley             | 2020-01-01 00:15:00, offset +02:00 | `2020/2020-01/local-folder/` |
| `phone/IMG_0301.HEIC`              | purple creature, mid-jump | 2021-09-01 00:20:05, offset +03:00 | `2021/2021-09/local-folder/` |
| `phone/IMG_0301.MOV`               | purple creature, bouncing | 2021-09-01 00:20:04, offset +03:00 | `2021/2021-09/local-folder/` |
| `phone/IMG_0420.PNG`               | screenshot of the others  | 2022-02-20 14:00:00, offset +01:00 | `2022/2022-02/local-folder/` |
| `camera/DSC_0042.JPG`              | green tree                | 2018-05-20 08:00:00, no offset     | `2018/2018-05/local-folder/` |
| `whatsapp/IMG-20210305-WA0003.jpg` | blue moon                 | none; its name says 2021-03-05     | `2021/2021-03/local-folder/` |

In UTC, `IMG_0187.JPG` was taken in December 2019, and `IMG_0301.HEIC` and
`IMG_0301.MOV` in August 2021. Each is filed by its local time, as
[R-PHOTO-7](../specs/layouts/photo-path-layout-spec.md) requires. `IMG_0301.MOV`
states its local time as Apple's creation date does, and its start as an instant
in UTC, as its movie header does.
