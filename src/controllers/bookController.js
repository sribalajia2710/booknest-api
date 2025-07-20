const Book = require('../models/book');
const { bookSchema, updateBookSchema } = require('../validators/book');
const logger = require('../utils/logger');

exports.createBook = async (req, res) => {
  const { error } = bookSchema.validate(req.body);
  if (error) {
    logger.warn(`Book creation validation failed: ${error.details[0].message}`);
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    if (!req.user || !req.user._id) {
      logger.error("Book creation failed: req.user is missing");
      return res.status(500).json({ message: "Internal server error: missing user info" });
    }

    const userId = req.user._id;
    const newBook = new Book({ ...req.body, addedBy: userId });

    logger.debug(`Creating book with data: ${JSON.stringify(newBook.toObject())}`);

    const savedBook = await newBook.save();
    logger.info(`Book created by user ${userId}: ${savedBook._id}`);
    res.status(201).json(savedBook);
  } catch (err) {
    logger.error(`Book creation failed: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    logger.info(`Books fetched: ${books.length} items`);
    res.json(books);
  } catch (err) {
    logger.error(`Fetching books failed: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

exports.updateBook = async (req, res) => {
  const { error } = updateBookSchema.validate(req.body);
  if (error) {
    logger.warn(`Book update validation failed: ${error.details[0].message}`);
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      logger.warn(`Book not found for update: ID ${req.params.id}`);
      return res.status(404).json({ message: 'Book not found' });
    }

    logger.info(`Book updated: ID ${req.params.id}`);
    res.json(updatedBook);
  } catch (err) {
    logger.error(`Book update failed: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      logger.warn(`Book not found for delete: ID ${req.params.id}`);
      return res.status(404).json({ message: 'Book not found' });
    }

    logger.info(`Book deleted: ID ${req.params.id}`);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    logger.error(`Book deletion failed: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};
