const Joi = require("joi");

const signupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("user", "admin").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

module.exports = {
  signupSchema,
  loginSchema,
};
