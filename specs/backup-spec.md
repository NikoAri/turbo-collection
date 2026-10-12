## 7. Backup

### 7.1 Mirroring (`R-MIRROR-*`)

The semantics of the mirror mechanism, as distinct from the storage layout
contract in Section 6. Mirroring is symmetric between peer copies, and is what
the **backup** operation (R-CLI-5) performs.

**R-MIRROR-1.** When mirroring two copies, Turbo-Collection MUST copy to each
copy every content file the other holds that is absent at it. If a **content
file** is present in both copies with differing content, Turbo-Collection MUST
NOT overwrite either copy, and MUST report the difference (R-INT-7). A meta file
MAY be replaced, under the conditions its own requirements state (R-REC-7 for a
receipt, R-INT-10 for a manifest).

> **Example.** Two copies hold different bytes at the same path: neither is
> overwritten, and the difference is reported.

**R-MIRROR-2.** Mirroring MUST be read-only with respect to every **content
file** already present in a copy. It MUST NOT modify, rename, move, or delete
one. Mirroring MUST record each arrival it makes in that directory's receipt,
and beyond the content files it adds and the meta files R-MIRROR-1 permits, MUST
write no other file into a copy (R-REC-5).

**R-MIRROR-3.** Turbo-Collection MUST NOT delete a file in any copy, and MUST
NOT provide a configuration setting or a command-line flag that permits deletion
in a copy. The single exception is R-MIRROR-8.

**R-MIRROR-4.**  
**Idempotence.**  
Mirroring copies already in agreement MUST transfer no file data.

**R-MIRROR-5.** Turbo-Collection MUST support more than one copy and MUST treat
each independently: a failure against one MUST NOT prevent the attempt against
another, and MUST still be reported.

**R-MIRROR-6.** An interrupted run (power loss, disconnected drive, termination)
MUST leave a copy in a state from which a subsequent run converges to a correct
mirror. A run MUST NOT leave a partially-written file that a later run would
mistake for a complete one.

**R-MIRROR-7.**  
**Dry-Run**  
Turbo-Collection MUST support a Dry-Run mode that reports exactly what a real
run would transfer, and mutates nothing.

**R-MIRROR-8.**  
**deletion exception for incomplete work.**  
Turbo-Collection MAY remove a temporary file (Section 3) that Turbo-Collection
itself created. Turbo-Collection MUST NOT remove anything else.

> **Example.** A half-written `photo.jpg.part` from an interrupted run may be
> removed; `photo.jpg` may not.

**R-MIRROR-9.** Turbo-Collection MUST verify a content file against its copy's
manifest immediately before copying that file to another copy. Turbo-Collection
MUST NOT copy a file whose checksum does not match, and MUST report the
mismatch.

> **Example.** A file that corrupted silently in one copy is caught before it
> reaches a fresh copy.
