import { AxiosError } from 'axios';

export interface LongpointErrorResponse {
  errorCode: string;
  messages: string[];
  details?: Record<string, any>;
}

export class LongpointError extends Error {
  public readonly errorCode: string;
  public readonly messages: string[];
  public readonly details?: Record<string, any>;
  public readonly statusCode: number;

  constructor(
    errorCode: string,
    messages: string[],
    statusCode: number,
    details?: Record<string, any>
  ) {
    const message = messages.length > 0 ? messages[0] : 'An error occurred';
    super(message);
    this.name = 'LongpointError';
    this.errorCode = errorCode;
    this.messages = messages;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LongpointError);
    }
  }

  /**
   * Creates a LongpointError from an AxiosError
   */
  static fromAxiosError(error: AxiosError<any>): LongpointError {
    const statusCode = error.response?.status || 500;

    // Try to extract error response from axios
    if (error.response?.data) {
      const errorData = error.response.data;

      // Check if the response matches our expected format
      if (
        typeof errorData === 'object' &&
        'errorCode' in errorData &&
        'messages' in errorData
      ) {
        return new LongpointError(
          errorData.errorCode,
          Array.isArray(errorData.messages)
            ? errorData.messages
            : [String(errorData.messages)],
          statusCode,
          errorData.details
        );
      }
    }

    // Fallback for unexpected error formats
    const errorMessage = error.response?.data
      ? String(error.response.data)
      : error.message || 'An unexpected error occurred';

    return new LongpointError('UNKNOWN', [errorMessage], statusCode);
  }
}
