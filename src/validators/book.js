const Joi = require('joi');

const bookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  author: Joi.string().trim().min(1).max(50).required(),
  isbn: Joi.string().pattern(/^[\d-]+$/).required(),
  genre: Joi.string().trim().min(1).required(),
  publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()).required(),
  pages: Joi.number().integer().min(1).required(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().min(0).required(),
});

const updateBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).optional(),
  author: Joi.string().trim().min(1).max(50).optional(),
  isbn: Joi.string().pattern(/^[\d-]+$/).optional(),
  genre: Joi.string().trim().min(1).optional(),
  publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()).optional(),
  pages: Joi.number().integer().min(1).optional(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().min(0).optional(),
});

module.exports = {
  bookSchema,
  updateBookSchema
};