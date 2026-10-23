// An error that code under scripts/ throws. Its class tells it apart from an
// error that Node or a third-party dependency throws, and its name, which
// begins its stack and its string, says so too.
export class TcError extends Error {
  override name = "TcError";
}
