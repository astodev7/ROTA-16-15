import express from "express";
import { createCheckout, paymentStatus, webhook } from "../controllers/payment.controller.js";
import { validateOrderInput } from "../middleware/validate.js";
import { orderLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();
router.post("/checkout", orderLimiter, validateOrderInput, createCheckout);
router.get("/status/:ref", paymentStatus);
router.post("/webhook", webhook);
export default router;
