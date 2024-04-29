import { Transform } from "stream";

export default class ByteRangeStream extends Transform {
  private bytesRead: bigint = BigInt(0);
  private readonly startByte: bigint;
  private readonly endByte: bigint;

  constructor(startByte: bigint, endByte: bigint) {
    super();
    this.startByte = startByte;
    this.endByte = endByte;
  }

  _transform(
    chunk: Buffer,
    _encoding: string,
    callback: (error?: Error | null, data?: Buffer) => void,
  ) {
    const chunkSize = BigInt(chunk.length);
    if (
      this.bytesRead + chunkSize >= this.startByte &&
      this.bytesRead < this.endByte
    ) {
      const start = Number(
        this.startByte > this.bytesRead ? this.startByte - this.bytesRead : 0n,
      );
      const end = Number(
        this.endByte > this.bytesRead + chunkSize
          ? chunkSize
          : this.endByte - this.bytesRead,
      );
      this.push(chunk.subarray(start, end));
    }
    this.bytesRead += chunkSize;
    callback();
  }
}
