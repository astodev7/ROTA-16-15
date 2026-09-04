import express from "express";

import {
    createOrder
} from "../controllers/order.controller.js";

import {
    validateOrderInput
} from "../middleware/validate.js";

import {
    orderLimiter
} from "../middleware/rateLimiters.js";

const router = express.Router();

// POST /api/orders
// {
//   items: [{ productId, qty }],
//   customer: {
//      name,
//      email,
//      phone,
//      address
//   }
// }

router.post(
    "/",
    orderLimiter,
    validateOrderInput,
    createOrder
);

export default router;