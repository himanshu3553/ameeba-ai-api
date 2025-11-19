/**
 * User Model Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import User from '../../models/User';

describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.name).toBe('Test User');
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.password).not.toBe('password123'); // Should be hashed
    });

    it('should require email', async () => {
      const user = new User({
        password: 'password123',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const user = new User({
        email: 'test@example.com',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const user = new User({
        email: 'invalid-email',
        password: 'password123',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await User.create(userData);
      const duplicateUser = new User(userData);

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should lowercase email', async () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@example.com');
    });

    it('should trim email', async () => {
      const user = new User({
        email: '  test@example.com  ',
        password: 'password123',
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@example.com');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await user.save();

      expect(savedUser.password).not.toBe('password123');
      expect(savedUser.password).toHaveLength(60); // bcrypt hash length
    });

    it('should not rehash password if not modified', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await user.save();
      const originalHash = savedUser.password;

      savedUser.name = 'Updated Name';
      await savedUser.save();

      expect(savedUser.password).toBe(originalHash);
    });

    it('should handle password hashing errors', async () => {
      // Mock bcrypt to throw an error
      const bcrypt = require('bcryptjs');
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error('Hashing failed'));

      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(user.save()).rejects.toThrow('Hashing failed');

      // Restore original function
      bcrypt.hash = originalHash;
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await user.save();
      const isValid = await savedUser.comparePassword('password123');

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await user.save();
      const isValid = await savedUser.comparePassword('wrongpassword');

      expect(isValid).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should update updatedAt on modification', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await user.save();
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      savedUser.name = 'Updated Name';
      await savedUser.save();

      expect(savedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});

