> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## Verify

### 7.2 Integrity (`R-INT-*`)

**R-INT-2.** Turbo-Collection MUST be able to verify any copy against a
manifest, and MUST report every discrepancy it finds.

**R-INT-3.** Verification MUST distinguish these outcomes per file, and MUST NOT
conflate them: **ok**; **missing** (in the manifest, absent on disk);
**corrupt** (present, but the checksum differs); **extra** (present on disk,
absent from the manifest).

**R-INT-5.** The manifest MUST record which hash algorithm produced it, so that
changing the algorithm later is explicit and detectable rather than silent.

**R-INT-6.** Verification MUST NOT repair, overwrite, or delete anything as a
side effect. It reports. Any repair MUST be a separate, explicitly requested
action.

> **Example.** Verification only reports; a verifier that "repaired" could
> overwrite a good copy with a bad one.

**R-INT-7.** On a mismatch between two copies' **content files** at the same
path, Turbo-Collection MUST report **which copies differ** and MUST NOT treat
any copy as authoritative. Choosing the surviving copy is a human decision. This
requirement MUST NOT be applied to meta files, which are per-copy records and
are expected to differ between copies.

**R-INT-8.** Turbo-Collection MUST report a **content file** that is **extra**
(present on disk, absent from its directory's manifest) as a finding, in
whichever copy it appears. A Run that reports one MUST exit with a non-zero
status (R-CLI-1). Turbo-Collection MUST NOT report a manifest as **extra** in
any copy, since R-MFILE-8 excludes it by design.

> **Example.** A file a person put into a Copy with a file manager is extra. No
> Backup carries it to another Copy, so a verify that finds it does not exit 0.

**R-INT-10.** Turbo-Collection MUST NOT replace a file's recorded checksum with
a newly computed one unless Turbo-Collection wrote that file's current content
itself. Rebuilding a manifest from a copy's present contents MUST be an action a
human explicitly requests, and MUST report every difference against the existing
manifest rather than overwriting it silently. Adding an entry for a file not yet
covered is not a replacement and is unrestricted.

> **Example.** A silent rebuild would hash a corrupted file and record its bad
> checksum as correct.

**R-INT-11.** Turbo-Collection MUST provide a read-only **verify copies**
inspection, which checks each Copy it acts on against that Copy's manifests. A
verify copies MUST NOT read the content of any Content File. For each Copy it
acts on, a verify copies MUST report every file a manifest lists that is absent
from that manifest's directory (**missing**), every file whose length in bytes
differs from the `size` its manifest records (**corrupt**), and every Content
File that no manifest lists (**extra**, R-INT-8). A verify copies MUST NOT
report a file as **ok**, since it compares no checksum.

**R-INT-12.** A verify copies MUST report every Content File that a manifest of
one Copy it acts on lists and that no manifest of another Copy it acts on lists
at the same path relative to each Copy's root, naming each Copy that lacks that
Content File. A verify copies MUST also report every path at which manifests of
two Copies it acts on list a Content File with differing checksums, naming which
Copies differ (R-INT-7).

**R-INT-13.** A verify copies MUST report every Copy it acts on whose ignore
file (`meta-file-spec.md` R-MFILE-20) does not hold the same patterns in the
same order as the ignore file of some other Copy it acts on, as
`backup-spec.md` R-MIRROR-12 compares them, where a Copy with no ignore file
holds no pattern.

**R-INT-14.** A Run in which a verify copies reports anything that R-INT-11,
R-INT-12 or R-INT-13 requires it to report MUST exit with a non-zero status
(R-CLI-1).

> **Example.** A verify copies acts on Copies named `main` and `off-site`. A
> photo deleted from `off-site` in a file manager is still listed in that Copy's
> manifest, so it is reported missing there. A photo imported into `main` since
> the last Backup is reported as lacking from `off-site`. Either report makes
> the Run exit non-zero, and neither needs a photo's content to be read, which
> only **verify fixity** does (R-INT-2).

> **The manifest.** Its name, placement, fields, and format are stated by
> [`meta-file-spec.md`](meta-file-spec.md) (R-MFILE-8 through R-MFILE-12), the
> only document code may cite for them.

> **Rationale.** Why detection and repair are kept separate, why a manifest
> rebuild is never silent, and why JSON with nothing beside it:
> [the manifest-format decision](../docs/decisions/2026-08-16-manifest-format-decision.md)
> and
> [the append-only decision](../docs/decisions/2026-08-13-append-only-decision.md).
> Why a verify copies reads names and sizes but no content, and leaves reading
> every byte to verify fixity:
> [the verify-copies decision](../docs/decisions/2026-10-19-verify-copies-decision.md).

### 7.3 Filename safety (`R-NAME-*`)

**R-NAME-1.** In a **verify names** inspection (`turbo-collection-core-spec.md`
R-CLI-5), Turbo-Collection MUST check collection filenames for hazards that do
not survive a move between common filesystems, and MUST report them. At minimum:
characters reserved on some filesystems; names differing only by case; Unicode
normalization differences (NFC versus NFD); trailing spaces or dots; reserved
device names; and path lengths beyond common limits.

**R-NAME-2.** Turbo-Collection MUST NOT silently rename a file to resolve such a
hazard. It reports; the human decides.

**R-NAME-3.** A filename hazard MUST NOT, by default, abort an otherwise valid
run. Hazards are reported as warnings, because a name that is harmless on
today's filesystem still needs backing up today.

### 7.4 Receipts (`R-REC-*`)

**R-REC-5.** Turbo-Collection MUST write an arrival file only **after** the
content that arrival covers has been completely written to the copy the arrival
names. The content an arrival covers is the content present in the directory at
that moment, which MAY be less than the whole directory; every file it covers
MUST be completely written, so that a partial arrival is still an honest
snapshot.

> **Example.** A run that dies mid-transfer leaves no arrival claiming the
> content arrived.

**R-REC-6.** On a mirror, Turbo-Collection MUST record an arrival as a receipt
file (R-MFILE-13, R-MFILE-14) for each directory into which it placed content,
and MUST bring both copies' receipt files to the union of the two for every
directory the mirror covers, not only those into which it placed content,
copying into a copy every receipt file the other holds that it lacks and never
overwriting one, since receipt files are immutable (R-MFILE-13). A directory in
which the mirror placed nothing gets no new arrival, because an arrival records
a placement and not a verification (R-REC-8), yet its receipt files still
converge, so one connected copy reports every copy's state for every directory
rather than only for those a given run changed. Every receipt write is the
core's responsibility; a copy's storage MUST NOT write a receipt (R-TGT-7).

**R-REC-7.** Turbo-Collection MUST NOT delete or alter a receipt file
(R-MFILE-13). An error therefore outlives the problem it describes: when the
content an error names later reaches the copy, the arrival is a new file and the
earlier error file remains, so the receipt states both events.

**R-REC-8.** A receipt records where content was **placed**, not where it
**remains**. Turbo-Collection MUST NOT treat a receipt as evidence that a copy
still exists or is still intact, and MUST NOT state a copy count derived from
receipts without stating the date of each arrival counted.

**R-REC-9.** Turbo-Collection MAY record a location receipt (R-MFILE-26) for the
copy it is operating on, stating that copy's `volumeId` and `relativePath` so a
later run can find the copy with fewer questions. It MUST write one only when
the copy's observed location differs from the most recent location receipt
already on record for that copy, so that an unchanged location does not
accumulate files. A location receipt locates a **candidate** only:
Turbo-Collection MUST confirm a copy's identity by reading its configuration
(R-MFILE-19) before treating a found copy as that copy or writing to it, and
MUST NOT infer identity from a matched `volumeId` or `relativePath`. The hint
MUST be optional and non-load-bearing: Turbo-Collection MUST function without
it, MUST fall back to asking when it is absent or no longer resolves, and MUST
NOT store an absolute path, deriving the mount point at run time from `volumeId`
instead. Location receipts propagate as every receipt file does: on a mirror,
Turbo-Collection MUST bring both copies' copy-root location receipts to the
union of the two, copying into each copy every one the other holds that it lacks
and never overwriting one (R-REC-6, R-REC-7). A location receipt records where a
copy was **observed**, not where it **remains** (R-REC-8).

> **Example.** A matched `volumeId` says only "look here"; the copy's identity
> is confirmed from its own configuration (R-MFILE-19), never from the matched
> id, so a reformatted or swapped drive simply fails to resolve.

> **Rationale.** Why receipts exist and are not logs, record arrivals and errors
> but never verifications, stay immutable, and why a location hint never settles
> identity:
> [the receipts decision](../docs/decisions/2026-09-07-receipts-decision.md) and
> [the location-receipt decision](../docs/decisions/2026-09-10-location-receipt-decision.md).
> The receipt file format, with a worked example, lives in
> [`meta-file-spec.md`](meta-file-spec.md) (R-MFILE-13).

