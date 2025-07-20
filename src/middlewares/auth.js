const User = require('../models/user');
const jwt = require("jsonwebtoken");
const logger = require('../utils/logger');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Authorization header missing");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info(`Token verified for userId: ${decoded.userId}`);

    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn(`User not found for ID: ${decoded.userId}`);
      return res.status(401).json({ message: "Invalid token user" });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error(`Token verification failed: ${err.message}`);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;
