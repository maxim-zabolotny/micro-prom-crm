import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import MicrotronAPI from '@lib/microtron';
import { MicroError } from '@lib/microtron/core/error';

@Catch(MicrotronAPI.MicroError)
export class MicrotronExceptionFilter implements ExceptionFilter {
  catch(exception: MicroError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status: statusCode, statusText, headers } = exception.response;

    response.status(statusCode).json({
      statusCode,
      statusText,
      headers,
      url: request.url,

      path: exception.path,
      errors: exception.errors,
      timestamp: exception.timestamp,
    });
  }
}
