const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { signupSchema, loginSchema } = require('../validators/user');
const logger = require('../utils/logger');

exports.signup = async (req, res) => {
  const { error } = signupSchema.validate(req.body);
  if (error) {
    logger.warn(`Signup validation failed: ${error.details[0].message}`);
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Signup attempt with existing email: ${email}`);
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.error(`Password mismatch after signup for user: ${email}`);
      return res.status(500).json({ message: "Password hashing failed" });
    }

    logger.info(`New user signed up: ${email}`);
    res.status(201).json(user);
  } catch (err) {
    logger.error(`Signup failed for ${req.body.email || 'unknown'}: ${err.message}`);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    logger.warn(`Login validation failed: ${error.details[0].message}`);
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Login failed: user not found - ${email}`);
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Login failed: incorrect password for ${email}`);
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info(`User logged in: ${email}`);
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error(`Login failed for ${req.body.email || 'unknown'}: ${err.message}`);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};
