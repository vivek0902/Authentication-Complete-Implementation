import { Router } from "express";
import {
  loginUser,
  registerUser,
  verifyUser,
  verifyLoginOtp,
  myProfile,
  refreshAccessToken,
  logoutUser,
} from "../controllers/user.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyLoginOtp);
router.get("/profile", isAuth, myProfile);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", isAuth, logoutUser);
export default router;
