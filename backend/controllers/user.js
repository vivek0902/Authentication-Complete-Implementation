import sanitize from "mongo-sanitize";
import TryCatch from "../middlewares/tryCatch.js";
import { LoginUserSchema, registerUserSchema } from "../config/zod.js";
import { redisClient } from "../index.js";
import { User } from "../models/user.js";
import becrypt from "bcrypt";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getOtpHtml, getVerifyEmailHtml } from "../config/email.html.js";
import {
  generateAccessToken,
  generateToken,
  revokeRefreshToken,
  verifyRefreshToken,
} from "../config/generateToken.js";

export const registerUser = TryCatch(async (req, res) => {
  const sanitezedBody = sanitize(req.body);
  const validation = registerUserSchema.safeParse(sanitezedBody);

  if (!validation.success) {
    const zodErrors = validation.error;
    let firstErrorMessage = "Validation error";
    let allErrors = [];

    if (zodErrors?.issues && Array.isArray(zodErrors.issues)) {
      allErrors = zodErrors.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Invalid input",
        code: issue.code || "invalid_input",
      }));

      firstErrorMessage = allErrors[0]?.message || "Validation error";
    }

    return res.status(400).json({
      message: firstErrorMessage,
      errors: allErrors,
    });
  }

  const { name, email, password } = validation.data;
  const rateLimitKey = `register-rate-limit:${req.ip}:${email}`;

  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Too many registration attempts. Please try again later.",
    });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      message: "User with this email already exists.",
    });
  }

  const hashPassword = await becrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const verifyKey = `verify-token:${verifyToken}`;
  const dataToStore = JSON.stringify({
    name,
    email,
    password: hashPassword,
  });

  await redisClient.set(verifyKey, dataToStore, { EX: 300 });

  const subject = "Verify your email for account creation";
  const html = getVerifyEmailHtml({ email, token: verifyToken });
  await sendMail({ email, subject, html });

  await redisClient.set(rateLimitKey, "true", { EX: 60 });
  res.json({
    message:
      "If your email is valid, a verification email has been sent. Please check your inbox. It will expire in 5 minutes.",
  });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({
      message: "Verification token is required.",
    });
  }
  const verifyKey = `verify-token:${token}`;
  const userDataJson = await redisClient.get(verifyKey);
  if (!userDataJson) {
    return res.status(400).json({
      message: "Invalid or expired verification token.",
    });
  }

  await redisClient.del(verifyKey);
  const userData = JSON.parse(userDataJson);
  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser) {
    return res.status(200).json({
      message: "Your account is already verified. You can now log in.",
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
      },
    });
  }

  try {
    const newUser = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });

    res.status(201).json({
      message:
        "User registered successfully!. Your account has been created. You can now log in.",
      user: { _id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    if (error?.code === 11000) {
      const verifiedUser = await User.findOne({ email: userData.email });

      return res.status(200).json({
        message: "Your account is already verified. You can now log in.",
        user: verifiedUser
          ? {
              _id: verifiedUser._id,
              name: verifiedUser.name,
              email: verifiedUser.email,
            }
          : undefined,
      });
    }

    throw error;
  }
});

export const loginUser = TryCatch(async (req, res) => {
  const sanitezedBody = sanitize(req.body);
  const validation = LoginUserSchema.safeParse(sanitezedBody);

  if (!validation.success) {
    const zodErrors = validation.error;
    let firstErrorMessage = "Validation error";
    let allErrors = [];

    if (zodErrors?.issues && Array.isArray(zodErrors.issues)) {
      allErrors = zodErrors.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Invalid input",
        code: issue.code || "invalid_input",
      }));

      firstErrorMessage = allErrors[0]?.message || "Validation error";
    }

    return res.status(400).json({
      message: firstErrorMessage,
      errors: allErrors,
    });
  }

  const { email, password } = validation.data;

  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;

  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      message: "Invalid email or password.",
    });
  }

  const isPasswordValid = await becrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid email or password.",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = `login-otp:${email}`;
  await redisClient.set(otpKey, JSON.stringify(otp), { EX: 300 });

  const subject = "Your OTP for login";
  const html = getOtpHtml({ email, otp });
  await sendMail({ email, subject, html });

  await redisClient.set(rateLimitKey, "true", { EX: 60 });
  res.json({
    message:
      "If your email is valid, an OTP has been sent to your email. Please check your inbox. It will expire in 5 minutes.",
  });
});

export const verifyLoginOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message: "Email and OTP are required.",
    });
  }

  const otpKey = `login-otp:${email}`;
  const storedOtpString = await redisClient.get(otpKey);
  if (!storedOtpString) {
    return res.status(400).json({
      message: "Invalid or expired OTP.",
    });
  }

  const storedOtp = JSON.parse(storedOtpString);
  if (storedOtp !== otp) {
    return res.status(400).json({
      message: "Invalid OTP.",
    });
  }

  await redisClient.del(otpKey);
  const user = await User.findOne({ email });

  const tokenData = await generateToken(user._id, res);
  res.json({
    message: `Login successful. Welcome ${user.name}!`,
    user: { _id: user._id, name: user.name, email: user.email },
  });
});

export const myProfile = TryCatch(async (req, res) => {
  res.json({
    user: req.user,
  });
});

export const refreshAccessToken = TryCatch(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      message: "Invalid refresh token.",
    });
  }

  const decoded = await verifyRefreshToken(refreshToken);

  if (!decoded) {
    return res.status(401).json({
      message: "Invalid refresh token.",
    });
  }

  generateAccessToken(decoded.id, res);
  res.status(200).json({
    message: "Access token refreshed successfully.",
  });
});

export const logoutUser = TryCatch(async (req, res) => {
  const userId = req.user._id;
  await revokeRefreshToken(userId);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  await redisClient.del(`user:${userId}`);
  res.json({
    message: "Logged out successfully.",
  });
});
