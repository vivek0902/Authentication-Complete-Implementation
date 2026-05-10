import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";
import { User } from "../models/user.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(403).json({
        message:
          "Access denied. No token provided. No Permission to access this resource.",
      });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedData || !decodedData.id) {
      return res.status(400).json({
        message: "Invalid token.",
      });
    }

    const cacheUser = await redisClient.get(`user:${decodedData.id}`);
    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      return next();
    }

    const user = await User.findById(decodedData.id).select("-password");

    if (!user) {
      return res.status(400).json({
        message: "User not found.",
      });
    }

    await redisClient.set(`user:${user._id}`, JSON.stringify(user), {
      EX: 60 * 60,
    }); // Cache for 1 hour
    req.user = user;
    next();
  } catch (err) {
    console.error("Error in isAuth middleware:", err);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
