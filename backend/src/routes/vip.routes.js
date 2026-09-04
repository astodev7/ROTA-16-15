import express from "express";

import {
    joinVip,
    getCount
} from "../controllers/vip.controller.js";

import {
    validateVipInput
} from "../middleware/validate.js";

import {
    vipJoinLimiter
} from "../middleware/rateLimiters.js";

const router = express.Router();

// POST /api/vip/join
// { name, email }

router.post(
    "/join",
    vipJoinLimiter,
    validateVipInput,
    joinVip
);

// GET /api/vip/count
router.get(
    "/count",
    getCount
);

export default router;