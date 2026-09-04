import * as vipModel from "../models/vip.model.js";
import * as productModel from "../models/product.model.js";
import * as orderModel from "../models/order.model.js";

import {
    issueToken,
    revokeToken,
    verifyAdminPassword,
    getTokenFromHeader
} from "../middleware/auth.js";

const CATEGORIAS_VALIDAS = [
    "camisetas",
    "moletons",
    "bermudas",
    "acessorios"
];

const PRECO_REGEX = /^\d+(\.\d{1,2})?$/;

async function login(req, res) {
    if (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH) {
        return res.status(500).json({
            message: "Nenhuma senha de admin configurada no .env do backend."
        });
    }

    const { password } = req.body || {};

    const ok = await verifyAdminPassword(password);

    if (!ok) {
        return res.status(401).json({
            message: "Senha incorreta."
        });
    }

    const token = issueToken();

    res.json({ token });
}

function logout(req, res) {
    const token = getTokenFromHeader(req);

    if (token) {
        revokeToken(token);
    }

    res.json({
        message: "Sessão encerrada."
    });
}


// ========================================
// LISTA VIP
// ========================================

async function listVip(req, res, next) {
    try {
        const list = await vipModel.getAll();
        res.json(list);
    } catch (error) {
        next(error);
    }
}

async function deleteVip(req, res, next) {
    try {
        const removed = await vipModel.removeById(req.params.id);

        if (!removed) {
            return res.status(404).json({
                message: "Inscrito não encontrado."
            });
        }

        res.json({
            message: "Inscrito removido da lista VIP."
        });
    } catch (error) {
        next(error);
    }
}


// ========================================
// PRODUTOS
// ========================================

async function listProducts(req, res, next) {
    try {
        const products = await productModel.getAll();

        res.json(products);
    } catch (error) {
        next(error);
    }
}


// Validação dos dados do produto
function validateProductPayload(body, { partial } = { partial: false }) {
    const {
        name,
        category,
        price,
        image,
        description,
        stock
    } = body || {};


    // Nome
    if (!partial || name !== undefined) {
        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 120
        ) {
            return "Nome do produto inválido (mínimo 2, máximo 120 caracteres).";
        }
    }


    // Categoria
    if (!partial || category !== undefined) {
        if (!CATEGORIAS_VALIDAS.includes(category)) {
            return "Categoria inválida.";
        }
    }


    // Preço
    if (!partial || price !== undefined) {
        const numericPrice = Number(price);

        if (
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(numericPrice) ||
            numericPrice < 0
        ) {
            return "Preço inválido.";
        }
    }


    // Imagem
    if (image !== undefined && image !== null) {
        if (
            typeof image !== "string" ||
            image.trim().length > 1000
        ) {
            return "URL da imagem inválida.";
        }
    }


    // Descrição
    if (description !== undefined && description !== null) {
        if (
            typeof description !== "string" ||
            description.trim().length > 2000
        ) {
            return "Descrição inválida.";
        }
    }


    // Estoque
    if (!partial || stock !== undefined) {
        const numericStock = Number(stock);

        if (
            stock === undefined ||
            stock === null ||
            stock === "" ||
            !Number.isInteger(numericStock) ||
            numericStock < 0
        ) {
            return "Estoque inválido.";
        }
    }

    return null;
}


// Criar produto
async function createProduct(req, res, next) {
    try {
        const error = validateProductPayload(req.body);

        if (error) {
            return res.status(400).json({
                message: error
            });
        }

        const {
            name,
            category,
            price,
            image,
            description,
            stock
        } = req.body;

        const product = await productModel.add({
            name,
            category,
            price,
            image,
            description,
            stock
        });

        res.status(201).json(product);

    } catch (error) {
        next(error);
    }
}


// Atualizar produto
async function updateProduct(req, res, next) {
    try {
        const error = validateProductPayload(
            req.body,
            { partial: true }
        );

        if (error) {
            return res.status(400).json({
                message: error
            });
        }

        const updated = await productModel.update(
            req.params.id,
            req.body || {}
        );

        if (!updated) {
            return res.status(404).json({
                message: "Produto não encontrado."
            });
        }

        res.json(updated);

    } catch (error) {
        next(error);
    }
}


// Deletar produto
async function deleteProduct(req, res, next) {
    try {
        const removed = await productModel.remove(
            req.params.id
        );

        if (!removed) {
            return res.status(404).json({
                message: "Produto não encontrado."
            });
        }

        res.json({
            message: "Produto removido."
        });

    } catch (error) {
        next(error);
    }
}


// ========================================
// PEDIDOS
// ========================================

async function listOrders(req, res, next) {
  try { res.json(await orderModel.getAll()); } catch (error) { next(error); }
}

async function updateOrderStatus(req, res, next) {
  try {
    const status = req.body?.status;
    const current = await orderModel.getById(req.params.id);
    if (!current) return res.status(404).json({ message: "Pedido não encontrado." });
    const updated = await orderModel.updateStatus(req.params.id, status);
    if (!updated) return res.status(400).json({ message: "Status inválido." });
    if (status === "cancelado" && current.status !== "cancelado" && current.paymentStatus !== "approved") await orderModel.restoreStock(req.params.id);
    res.json(updated);
  } catch (error) { next(error); }
}

async function deleteOrder(req, res, next) {
  try {
    const current = await orderModel.getById(req.params.id);
    if (!current) return res.status(404).json({ message: "Pedido não encontrado." });
    if (current.status !== "cancelado" && current.paymentStatus !== "approved") await orderModel.restoreStock(req.params.id);
    const removed = await orderModel.remove(req.params.id);
    if (!removed) return res.status(404).json({ message: "Pedido não encontrado." });
    res.json({ message: "Pedido removido." });
  } catch (error) { next(error); }
}

export {
  login, logout, listVip, deleteVip,
  listProducts, createProduct, updateProduct, deleteProduct,
  listOrders, updateOrderStatus, deleteOrder
};
