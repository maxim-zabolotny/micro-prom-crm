import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { LibErrors } from '@lib/prom';

@Catch(LibErrors.PromAPIError, LibErrors.AxiosExtendedError)
export class PromExceptionFilter implements ExceptionFilter {
  catch(
    exception: LibErrors.PromAPIError<any> | LibErrors.AxiosExtendedError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof LibErrors.PromAPIError) {
      response.status(500).json({
        type: exception.type,
        message: exception.message,
        data: exception.data,

        path: exception.path,
        timestamp: exception.timestamp,
      });
    }

    if (exception instanceof LibErrors.AxiosExtendedError) {
      const { status: statusCode, statusText } = exception.response;

      response.status(statusCode).json({
        statusCode,
        statusText,

        url: request.url,

        message: exception.message,
        data: exception.data,

        path: exception.path,
        timestamp: exception.timestamp,
      });
    }
  }
}
