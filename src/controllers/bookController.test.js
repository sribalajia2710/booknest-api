const bookController = require('../controllers/bookController');
const Book = require('../models/book');
const logger = require('../utils/logger');
const { bookSchema, updateBookSchema } = require('../validators/book');

jest.mock('../models/book');
jest.mock('../utils/logger');
jest.mock('../validators/book', () => ({
  bookSchema: { validate: jest.fn() },
  updateBookSchema: { validate: jest.fn() },
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('bookController', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createBook', () => {
    it('should return 400 if validation fails', async () => {
      const req = { body: {}, user: { _id: 'user123' } };
      const res = mockRes();

      bookSchema.validate.mockReturnValue({ error: { details: [{ message: 'Validation error' }] } });

      await bookController.createBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation error' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return 500 if user is missing', async () => {
      const req = { body: {}, user: null };
      const res = mockRes();

      bookSchema.validate.mockReturnValue({ error: null });

      await bookController.createBook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('missing user info') });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should create and return book if valid', async () => {
      const req = { body: { title: 'Test Book' }, user: { _id: 'user123' } };
      const res = mockRes();

      bookSchema.validate.mockReturnValue({ error: null });

      const mockSave = jest.fn().mockResolvedValue({ _id: 'book123' });
      Book.mockImplementation(() => ({ ...req.body, addedBy: req.user._id, save: mockSave, toObject: () => req.body }));

      await bookController.createBook(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ _id: 'book123' });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const req = { body: { title: 'Test Book' }, user: { _id: 'user123' } };
      const res = mockRes();

      bookSchema.validate.mockReturnValue({ error: null });

      Book.mockImplementation(() => ({
        ...req.body,
        addedBy: req.user._id,
        toObject: () => req.body,
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      }));

      await bookController.createBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getBooks', () => {
    it('should return all books', async () => {
      const req = {};
      const res = mockRes();
      Book.find.mockResolvedValue([{ title: 'A' }, { title: 'B' }]);

      await bookController.getBooks(req, res);

      expect(res.json).toHaveBeenCalledWith([{ title: 'A' }, { title: 'B' }]);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle DB error', async () => {
      const req = {};
      const res = mockRes();
      Book.find.mockRejectedValue(new Error('DB fail'));

      await bookController.getBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB fail' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateBook', () => {
    it('should return 400 if validation fails', async () => {
      const req = { body: {}, params: { id: 'book123' } };
      const res = mockRes();

      updateBookSchema.validate.mockReturnValue({ error: { details: [{ message: 'Invalid data' }] } });

      await bookController.updateBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return 404 if book not found', async () => {
      const req = { body: { title: 'New' }, params: { id: 'book123' } };
      const res = mockRes();

      updateBookSchema.validate.mockReturnValue({ error: null });
      Book.findByIdAndUpdate.mockResolvedValue(null);

      await bookController.updateBook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Book not found' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should update book and return it', async () => {
      const req = { body: { title: 'Updated' }, params: { id: 'book123' } };
      const res = mockRes();

      updateBookSchema.validate.mockReturnValue({ error: null });
      Book.findByIdAndUpdate.mockResolvedValue({ _id: 'book123', title: 'Updated' });

      await bookController.updateBook(req, res);

      expect(res.json).toHaveBeenCalledWith({ _id: 'book123', title: 'Updated' });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle DB error', async () => {
      const req = { body: {}, params: { id: 'book123' } };
      const res = mockRes();

      updateBookSchema.validate.mockReturnValue({ error: null });
      Book.findByIdAndUpdate.mockRejectedValue(new Error('Update fail'));

      await bookController.updateBook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Update fail' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteBook', () => {
    it('should delete book and return success message', async () => {
      const req = { params: { id: 'book123' } };
      const res = mockRes();
      Book.findByIdAndDelete.mockResolvedValue({ _id: 'book123' });

      await bookController.deleteBook(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Book deleted successfully' });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should return 404 if book not found', async () => {
      const req = { params: { id: 'book123' } };
      const res = mockRes();
      Book.findByIdAndDelete.mockResolvedValue(null);

      await bookController.deleteBook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Book not found' });
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle DB error', async () => {
      const req = { params: { id: 'book123' } };
      const res = mockRes();
      Book.findByIdAndDelete.mockRejectedValue(new Error('Delete fail'));

      await bookController.deleteBook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Delete fail' });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
