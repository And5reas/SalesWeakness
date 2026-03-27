import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
}

/**
 * Global HTTP exception filter that normalises all error responses to a
 * consistent shape and logs server errors (5xx) for observability.
 *
 * Response shape:
 * { statusCode, timestamp, path, method, message }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message ??
        exception.message;

    const body: ErrorBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
      message,
    };

    // Log 5xx as errors; 4xx are expected client errors
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(JSON.stringify(body), exception.stack);
    }

    res.status(status).json(body);
  }
}
