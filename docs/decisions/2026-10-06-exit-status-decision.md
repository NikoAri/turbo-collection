# A run exits 0 only when it was fully successful, and the exit status says nothing more

**Status:** Accepted
**Date:** 2026-10-06

A run exits with status 0 only where every operation in it did everything it was asked to do and
found nothing wrong. Anything else exits non-zero: a file refused or left out, a mismatch, a finding
from verify, an operation that could not finish. No particular non-zero value means anything; the
report and the log say what happened.

**One rule replaces a table that was never written.** The core specification had deferred a taxonomy
of failure classes and their codes until the failure modes were worked through. The rule that was
needed does not depend on them: a scheduled run and a person both need one thing from an exit
status, which is whether to look.

**A report of what a run did is not a failure.** The files placed by the floor, the count each
ignore pattern matched, what a dry run would do, and what status knows about arrivals are output.
Only a report of something that could not be done, was refused, or was found wrong changes the exit
status.

**An extra file is a failure.** A content file that no manifest lists is one that no backup carries
to another copy. It used to be reported with an exit status of 0, from a time when nothing could
take such a file in. An in-place import does (`R-CLI-12`), so the finding has a cure and no reason
to pass quietly.

**A copy that is not connected is not.** The off-site copy is away by design, so a verify at home
that failed on its absence would fail every time, and an exit status that always fails says nothing.
Verify checks the copies that are connected and names the ones that are not (`R-CLI-17`).

## Rejected

- **A distinct exit code per failure class.** Nothing reads one, and a table fixed before an
  implementation exists would be a contract with no evidence behind it.
- **Exit 0 with warnings.** A run that left something undone and exited 0 is read as complete, by a
  scheduler and by a person in a hurry.
- **Failing on a copy that is not connected.** As above.

## Touches

`turbo-collection-spec.md`: `R-CLI-1` restated; Section 8.5 rewritten; `R-INT-8` has a run that
reports an extra file exit non-zero; `R-CLI-10` states that what status reports does not change an
exit status. `R-SRC-23` and `R-SRC-24` state theirs.
