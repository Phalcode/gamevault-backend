import { Transform } from "stream";

export default class ByteRangeStream extends Transform {
  private bytesRead: bigint = 0n;
  private readonly startByte: bigint;
  private readonly endByte: bigint;
  private isDone: boolean = false; // Stop processing when done

  constructor(startByte: bigint, endByte: bigint) {
    super({ highWaterMark: 4 * 1024 * 1024 }); // 4MB buffer for faster seeking
    this.startByte = startByte;
    this.endByte = endByte;
  }

  _transform(
    chunk: Buffer,
    _encoding: string,
    callback: (error?: Error | null, data?: Buffer) => void,
  ) {
    if (this.isDone) return callback(); // Stop processing if range is complete

    const chunkSize = BigInt(chunk.length);
    const chunkEnd = this.bytesRead + chunkSize - 1n;

    if (chunkEnd < this.startByte) {
      // 🔹 Skip entire chunk if before range
      this.bytesRead += chunkSize;
      return callback();
    }

    if (this.bytesRead > this.endByte) {
      // 🔹 Stop processing if past range
      this.isDone = true;
      return callback();
    }

    // 🔹 Compute exact start and end positions
    let start =
      this.startByte > this.bytesRead
        ? Number(this.startByte - this.bytesRead)
        : 0;
    let end =
      this.endByte >= chunkEnd ? chunkSize : this.endByte - this.bytesRead + 1n;

    this.push(chunk.subarray(start, Number(end)));
    this.bytesRead += chunkSize;
    callback();
  }
}
