// Little-endian reads over a program's bytes, every one checked against the end: the debug core's only DataView.

export class DebugInfoError extends Error {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(message + " (offset " + offset + ")");
    this.name = "DebugInfoError";
    this.offset = offset;
    Object.setPrototypeOf(this, DebugInfoError.prototype); // the build targets ES5, where a subclass of Error loses its prototype
  }
}

const utf8 = new TextDecoder("utf-8");

export class ByteReader {
  readonly length: number;
  private readonly view: DataView;

  constructor(readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.length = bytes.length;
  }

  private need(at: number, size: number): void {
    if (!(at >= 0 && size >= 0 && at + size <= this.length)) throw new DebugInfoError("The program's debug information is cut short", at);
  }

  u8(at: number): number {
    this.need(at, 1);
    return this.bytes[at];
  }

  u16(at: number): number {
    this.need(at, 2);
    return this.view.getUint16(at, true);
  }

  u32(at: number): number {
    this.need(at, 4);
    return this.view.getUint32(at, true);
  }

  i8(at: number): number {
    this.need(at, 1);
    return this.view.getInt8(at);
  }

  i16(at: number): number {
    this.need(at, 2);
    return this.view.getInt16(at, true);
  }

  i32(at: number): number {
    this.need(at, 4);
    return this.view.getInt32(at, true);
  }

  slice(at: number, size: number): Uint8Array {
    this.need(at, size);
    return this.bytes.subarray(at, at + size);
  }

  text(at: number, size: number): string {
    return utf8.decode(this.slice(at, size));
  }

  // a name with its length in the byte before it; `next` is the offset after it
  name(at: number): { text: string; next: number } {
    const size = this.u8(at);
    return { text: this.text(at + 1, size), next: at + 1 + size };
  }

  // text up to a zero byte, within `limit` bytes
  zeroTerminated(at: number, limit: number): string {
    this.need(at, 0);
    const end = Math.min(this.length, at + limit);
    let stop = at;
    while (stop < end && this.bytes[stop] !== 0) stop++;
    return this.text(at, stop - at);
  }
}
