import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = jest
  .fn()
  .mockReturnValue({ url: '/test', method: 'GET' });

const mockHttpArgumentsHost = {
  getResponse: mockGetResponse,
  getRequest: mockGetRequest,
};

const mockArgumentsHost = {
  switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
} as unknown as ArgumentsHost;

import type { ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.clearAllMocks();
    mockStatus.mockReturnValue({ json: mockJson });
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle a 404 HttpException', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        path: '/test',
        method: 'GET',
        message: 'Not found',
      }),
    );
  });

  it('should handle a 422 HttpException with array message', () => {
    const exception = new HttpException(
      { message: ['email must be an email', 'source should not be empty'] },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: ['email must be an email', 'source should not be empty'],
      }),
    );
  });

  it('should handle 500 internal server errors', () => {
    const exception = new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('should include timestamp in response body', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    const [firstCall] = mockJson.mock.calls as [Record<string, unknown>][];
    const body = firstCall[0];
    expect(typeof body['timestamp']).toBe('string');
    expect(new Date(body['timestamp'] as string).getTime()).not.toBeNaN();
  });
});
