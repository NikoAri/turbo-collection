# Freeing iCloud storage

**Goal:** move photos into the collection, confirm they arrived intact, then delete them from iCloud
and from the phone to reclaim that storage.

This is one of the reasons the project exists. See `design-record.md` §1, hard goal *Safe release of
a source copy*. Turbo-Collection never deletes anything at a source; R-SRC-7 forbids it. Every
deletion below is yours, taken against evidence.

**Performable today, by hand, with no Turbo-Collection code.** The steps use Photos.app and a
standard checksum tool.

---

## Before you start

Deletion is the one step here you cannot undo from this side. iCloud's Recently Deleted album holds
items for 30 days, which is a backstop rather than a plan.

**The reliability caveat that matters most.** A 2026-07-23 observation recorded 35 files silently
missing from a Photos export of 47,508 items. Fidelity of the export is verified; **completeness at
scale is not**. So the count check in step 3 is not bureaucracy, it is the whole safety property, and
working in batches you can actually count is the reason this workflow says to.

## 1. Export originals from Photos

On a Mac, with the library fully downloaded rather than optimized:

- Select a batch you can verify, not the whole library.
- `File > Export > Export Unmodified Original for N photos`.
- Set **Subfolder Format: None**. Photos' `Moment Name` option emits directory names containing
  no-break spaces (U+00A0), ampersands, commas, and your home location.
- Keep original filenames.

A Live Photo exports as a still plus a lowercase `.mov` companion. Both halves belong to one item,
and losing one silently is exactly what step 3 exists to catch.

## 2. Move the export into the collection

Place files under the collection's layout convention. **[unbacked]** Do not delete the export folder
yet; it is your second copy until step 4 finishes.

## 3. Verify, and count **[unbacked]**

Two separate checks, and neither substitutes for the other.

**Count.** Compare the number of files exported against the number Photos said it would export,
remembering that each Live Photo contributes two. A mismatch means step 1 lost something. Do not
proceed.

**Checksum.** Compute SHA-256 for every file and confirm each is recorded in the collection's
manifest, matching. On macOS or Linux:

```
shasum -a 256 * > exported.sha256
shasum -a 256 -c exported.sha256
```

The property you need before deleting is narrow and specific: *these exact items are in the
collection, and their bytes match*. Verifying the whole collection does not establish it, and neither
does a successful-looking export.

## 4. Mirror to at least one target, and verify there too **[unbacked]**

A photo that exists only on the collection drive is one drive failure away from gone. Mirror, then
verify the target against its own manifest (R-TGT-9 requires each target to carry one).

Deleting from iCloud after step 3 but before step 4 leaves you with a single copy for however long
that gap lasts. That gap is the riskiest state in this workflow.

## 5. Now delete from iCloud

In Photos, delete the batch you verified. Deleting on any signed-in device removes it everywhere,
and it lands in Recently Deleted for 30 days.

Nothing propagates back. The collection keeps what you deleted, because Turbo-Collection never
computes the collection-to-source direction and so can never act on it. That rule is decided and
still unwritten as of 2026-08-01; it is item 1 of the drafting queue.

## 6. Let the Recently Deleted window pass before reusing the space

Thirty days of free undo costs nothing. Treat reclaimed space as available only after it expires.

---

## What is owed before this workflow is trustworthy

1. **A safe-to-delete query.** Steps 3 and 4 ask whether a *specific set of items* is stored and
   intact. R-INT-2 verifies a whole tree and R-CLI-9 checks adapter health; neither answers it. That
   gap is tracked as part of the append-only drafting.
2. **`R-OP-*` requirements** to replace every **[unbacked]** marker above.
3. **Export completeness at scale**, still unmeasured. Until it is, batch sizes stay countable.
