import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser } from "../../middleware/auth.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";

const router = Router();

router.post("/register", validateRequest(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post("/login", validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post("/logout", (req, res, next) =>
  authController.logout(req, res, next)
);

router.get("/me", authenticateUser, (req, res, next) =>
  authController.me(req, res, next)
);

router.post("/forgot-password", validateRequest(forgotPasswordSchema), (req, res, next) =>
  authController.forgotPassword(req, res, next)
);

router.post("/reset-password", validateRequest(resetPasswordSchema), (req, res, next) =>
  authController.resetPassword(req, res, next)
);

export default router;
