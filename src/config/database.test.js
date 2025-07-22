const mongoose = require('mongoose');
const connectDB = require('./database');

jest.mock('mongoose');

describe('connectDB', () => {
  const originalEnv = process.env;
  let exitSpy;

  beforeEach(() => {
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost:27017/test' };
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  it('should connect to MongoDB and log host', async () => {
    const mockConn = { connection: { host: 'localhost' } };
    mongoose.connect.mockResolvedValue(mockConn);

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
    expect(consoleLogSpy).toHaveBeenCalledWith('MongoDB Connected: localhost');

    consoleLogSpy.mockRestore();
  });

  it('should log error and exit process on connection failure', async () => {
    const error = new Error('Connection failed');
    mongoose.connect.mockRejectedValue(error);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await connectDB();

    expect(consoleErrorSpy).toHaveBeenCalledWith('MongoDB connection error:', 'Connection failed');
    expect(exitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
  });
});
