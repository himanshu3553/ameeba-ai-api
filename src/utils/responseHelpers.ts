/**
 * Response helper utilities
 * Provides consistent API response formatting
 */

import { Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { ApiResponse } from '../types';

/**
 * Send a successful response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = HTTP_STATUS.OK
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
};

/**
 * Send a successful response with count
 */
export const sendSuccessWithCount = <T>(
  res: Response,
  data: T[],
  count: number,
  statusCode: number = HTTP_STATUS.OK
): void => {
  const response: ApiResponse<T[]> = {
    success: true,
    count,
    data,
  };
  res.status(statusCode).json(response);
};

/**
 * Send a created response
 */
export const sendCreated = <T>(
  res: Response,
  data: T
): void => {
  sendSuccess(res, data, HTTP_STATUS.CREATED);
};

/**
 * Send a success response with message
 */
export const sendSuccessWithMessage = <T>(
  res: Response,
  data: T,
  message: string,
  statusCode: number = HTTP_STATUS.OK
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};

