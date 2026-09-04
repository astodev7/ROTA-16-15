import express from "express";

import {
    login,
    logout,
    listVip,
    deleteVip,
    listProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    listOrders,
    updateOrderStatus,
    deleteOrder
} from "../controllers/admin.controller.js";

import { adminAuth } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// POST /api/admin/login
// Rota pública para login do administrador.
router.post(
    "/login",
    loginLimiter,
    login
);

// A partir daqui, todas as rotas exigem:
// Authorization: Bearer <token>
router.use(adminAuth);

router.post("/logout", logout);

router.get("/vip", listVip);
router.delete("/vip/:id", deleteVip);

router.get("/products", listProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders", listOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);

export default router;