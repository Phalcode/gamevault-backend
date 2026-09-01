import { HttpException, HttpStatus } from "@nestjs/common";
import { LoggingExceptionFilter } from "./http-exception.filter.js";

describe("LoggingExceptionFilter", () => {
  let filter: LoggingExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new LoggingExceptionFilter();
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockRequest = { url: "/api/test" };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it("should handle HttpException with 4xx status (warn)", () => {
    const exception = new HttpException("Not Found", HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost as any);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(exception.getResponse());
  });

  it("should handle HttpException with 5xx status (error)", () => {
    const exception = new HttpException(
      "Internal Server Error",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    filter.catch(exception, mockHost as any);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(exception.getResponse());
  });

  it("should handle HttpException with 400 Bad Request", () => {
    const exception = new HttpException("Bad Request", HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost as any);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(exception.getResponse());
  });

  it("should handle non-HttpException errors with 500 status", () => {
    const error = new Error("Something broke");
    filter.catch(error, mockHost as any);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: "Unhandled Server Error",
      }),
    );
  });

  it("should handle TypeError as unhandled error", () => {
    const error = new TypeError("Cannot read property of undefined");
    filter.catch(error, mockHost as any);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Unhandled Server Error"),
      }),
    );
  });

  it("should handle HttpException with object response", () => {
    const exception = new HttpException(
      { message: "Validation failed", errors: ["field is required"] },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    filter.catch(exception, mockHost as any);
    expect(mockResponse.status).toHaveBeenCalledWith(422);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Validation failed" }),
    );
  });
});
