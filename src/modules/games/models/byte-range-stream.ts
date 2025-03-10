import { Transform } from "stream";

export default class ByteRangeStream extends Transform {
  private bytesRead: bigint = 0n;
  private readonly startByte: bigint;
  private readonly endByte: bigint;
  private isDone: boolean = false; // Flag to stop unnecessary processing

  constructor(startByte: bigint, endByte: bigint) {
    super({ highWaterMark: 1024 * 1024 }); // 1MB chunk size
    this.startByte = startByte;
    this.endByte = endByte;
  }

  _transform(
    chunk: Buffer,
    _encoding: string,
    callback: (error?: Error | null, data?: Buffer) => void,
  ) {
    if (this.isDone) {
      return callback(); // Stop processing if range has been completed
    }

    const chunkSize = BigInt(chunk.length);
    const chunkEnd = this.bytesRead + chunkSize - 1n;

    if (chunkEnd < this.startByte) {
      // Skip chunks entirely before startByte
      this.bytesRead += chunkSize;
      return callback();
    }

    if (this.bytesRead > this.endByte) {
      // Stop processing if we've passed the endByte
      this.isDone = true;
      return callback();
    }

    const start =
      this.startByte > this.bytesRead ? this.startByte - this.bytesRead : 0n;
    const end =
      this.endByte >= chunkEnd ? chunkSize : this.endByte - this.bytesRead + 1n;

    // Only slice if necessary
    if (start > 0n || end < chunkSize) {
      this.push(chunk.subarray(Number(start), Number(end)));
    } else {
      this.push(chunk);
    }

    this.bytesRead += chunkSize;
    callback();
  }
}
