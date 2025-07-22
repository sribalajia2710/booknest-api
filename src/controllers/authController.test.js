const authController = require('../controllers/authController');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { signupSchema, loginSchema } = require('../validators/user');

jest.mock('../models/user');
jest.mock('jsonwebtoken');
jest.mock('../utils/logger');
jest.mock('../validators/user', () => ({
  signupSchema: { validate: jest.fn() },
  loginSchema: { validate: jest.fn() },
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController', () => {
  afterEach(() => jest.clearAllMocks());

  describe('signup', () => {
    it('should return 400 if validation fails', async () => {
      const req = { body: {} };
      const res = mockRes();
      signupSchema.validate.mockReturnValue({ error: { details: [{ message: 'Invalid input' }] } });

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return 400 if email already exists', async () => {
      const req = { body: { email: 'test@example.com' } };
      const res = mockRes();

      signupSchema.validate.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue({ _id: 'existingUserId' });

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return 500 if password check fails', async () => {
      const req = {
        body: { name: 'John', email: 'john@example.com', password: 'pass123', role: 'user' },
      };
      const res = mockRes();

      signupSchema.validate.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(null);

      const mockUserInstance = {
        comparePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn(),
        email: 'john@example.com',
      };
      User.mockImplementation(() => mockUserInstance);

      await authController.signup(req, res);

      expect(mockUserInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password hashing failed' });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should create user and return 201', async () => {
      const req = {
        body: { name: 'John', email: 'john@example.com', password: 'pass123', role: 'user' },
      };
      const res = mockRes();

      signupSchema.validate.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(null);

      const mockUserInstance = {
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
        email: 'john@example.com',
      };
      User.mockImplementation(() => mockUserInstance);

      await authController.signup(req, res);

      expect(mockUserInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockUserInstance);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle signup errors', async () => {
      const req = {
        body: { name: 'John', email: 'john@example.com', password: 'pass123', role: 'user' },
      };
      const res = mockRes();

      signupSchema.validate.mockReturnValue({ error: null });
      User.findOne.mockRejectedValue(new Error('DB error'));

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Signup failed',
        error: 'DB error',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return 400 if validation fails', async () => {
      const req = { body: {} };
      const res = mockRes();

      loginSchema.validate.mockReturnValue({ error: { details: [{ message: 'Invalid input' }] } });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return 400 if user not found', async () => {
      const req = { body: { email: 'x@example.com', password: 'pass' } };
      const res = mockRes();

      loginSchema.validate.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return 400 if password is incorrect', async () => {
      const req = { body: { email: 'x@example.com', password: 'wrong' } };
      const res = mockRes();

      const user = { comparePassword: jest.fn().mockResolvedValue(false), email: 'x@example.com' };
      loginSchema.validate.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(user);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect password' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should login user and return token', async () => {
      const req = { body: { email: 'x@example.com', password: 'pass' } };
      const res = mockRes();

      const user = {
        _id: 'user123',
        email: 'x@example.com',
        name: 'Test User',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      loginSchema.validate.mockReturnValue({ error: null });
      User.findOne.mockResolvedValue(user);
      jwt.sign.mockReturnValue('mock.jwt.token');

      await authController.login(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', email: 'x@example.com', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'mock.jwt.token',
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'x@example.com',
        },
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      const req = { body: { email: 'err@example.com', password: 'pass' } };
      const res = mockRes();

      loginSchema.validate.mockReturnValue({ error: null });
      User.findOne.mockRejectedValue(new Error('DB login error'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login failed',
        error: 'DB login error',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
