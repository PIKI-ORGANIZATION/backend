import { Router } from 'express';
import { login, register, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, getMe, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { cache } from '../middlewares/cache.middleware';
import { errorHandler } from '../middlewares/error.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema, verifyEmailSchema, resendEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.schema.js';
import { rateLimitLogin, rateLimitResendEmail, rateLimitForgotPassword } from '../middlewares/rateLimiter.middleware';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post("/login", rateLimitLogin, validate(loginSchema), login);
router.post("/register", validate(registerSchema), register);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", rateLimitResendEmail, validate(resendEmailSchema), resendVerification);
router.post("/forgot-password", rateLimitForgotPassword, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.post("/profile", authenticate, updateProfile); // New self-update endpoint
router.post("/change-password", authenticate, changePassword);

export default router;
