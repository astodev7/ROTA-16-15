import express from "express";

import {
    listProducts
} from "../controllers/product.controller.js";

const router = express.Router();

// GET /api/products?category=camisetas
router.get("/", listProducts);

export default router;