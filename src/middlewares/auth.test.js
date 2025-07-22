const verifyToken = require('./auth');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

jest.mock('../models/user');
jest.mock('jsonwebtoken');
jest.mock('../utils/logger');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('verifyToken middleware', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return 401 if authorization header is missing', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(logger.warn).toHaveBeenCalledWith('Authorization header missing');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    const req = { headers: { authorization: 'Bearer invalidtoken' } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation(() => { throw new Error('Invalid token') });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(logger.error).toHaveBeenCalledWith('Token verification failed: Invalid token');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user not found', async () => {
    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ userId: 'user123' });
    User.findById.mockResolvedValue(null);

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token user' });
    expect(logger.warn).toHaveBeenCalledWith('User not found for ID: user123');
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user to req and call next if valid token and user exists', async () => {
    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = mockRes();
    const next = jest.fn();

    const mockUser = { _id: 'user123', name: 'Test User' };
    jwt.verify.mockReturnValue({ userId: 'user123' });
    User.findById.mockResolvedValue(mockUser);

    await verifyToken(req, res, next);

    expect(req.user).toBe(mockUser);
    expect(next).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Token verified for userId: user123');
  });
});
