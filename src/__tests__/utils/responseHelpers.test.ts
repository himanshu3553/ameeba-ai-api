/**
 * Response Helpers Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Response } from 'express';
import {
  sendSuccess,
  sendSuccessWithCount,
  sendCreated,
  sendSuccessWithMessage,
} from '../../utils/responseHelpers';
import { HTTP_STATUS } from '../../constants';

describe('Response Helpers', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with default status code', () => {
      const data = { id: 1, name: 'Test' };

      sendSuccess(mockResponse as Response, data);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should send success response with custom status code', () => {
      const data = { id: 1, name: 'Test' };

      sendSuccess(mockResponse as Response, data, HTTP_STATUS.CREATED);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });
  });

  describe('sendSuccessWithCount', () => {
    it('should send success response with count', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const count = 2;

      sendSuccessWithCount(mockResponse as Response, data, count);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count,
        data,
      });
    });

    it('should send success response with count and custom status code', () => {
      const data = [{ id: 1 }];
      const count = 1;

      sendSuccessWithCount(mockResponse as Response, data, count, HTTP_STATUS.CREATED);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count,
        data,
      });
    });
  });

  describe('sendCreated', () => {
    it('should send created response', () => {
      const data = { id: 1, name: 'Test' };

      sendCreated(mockResponse as Response, data);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });
  });

  describe('sendSuccessWithMessage', () => {
    it('should send success response with message', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Operation successful';

      sendSuccessWithMessage(mockResponse as Response, data, message);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message,
        data,
      });
    });

    it('should send success response with message and custom status code', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Updated successfully';

      sendSuccessWithMessage(mockResponse as Response, data, message, HTTP_STATUS.OK);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message,
        data,
      });
    });
  });
});

