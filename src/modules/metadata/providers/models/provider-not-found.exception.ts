import { HttpException, HttpStatus } from "@nestjs/common";

export class ProviderNotFoundException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}
