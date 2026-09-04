const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// ========================================
// VALIDAÇÃO DA LISTA VIP
// ========================================

function validateVipInput(req, res, next) {
    const {
        name,
        email
    } = req.body || {};


    if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
    ) {
        return res.status(400).json({
            message: "Informe um nome válido (2 a 100 caracteres)."
        });
    }


    const normalizedEmail =
        typeof email === "string"
            ? email.trim()
            : "";


    if (
        !normalizedEmail ||
        normalizedEmail.length > 190 ||
        !EMAIL_REGEX.test(normalizedEmail)
    ) {
        return res.status(400).json({
            message: "Informe um e-mail válido."
        });
    }


    next();
}


// ========================================
// VALIDAÇÃO DE PEDIDOS
// ========================================

const MAX_ITEM_QTY = 20;

const MAX_ITEMS_PER_ORDER = 30;

const PHONE_REGEX = /^[\d\s()+-]{8,20}$/;


function validateOrderInput(req, res, next) {
    const {
        items,
        customer
    } = req.body || {};


    // Carrinho vazio
    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            message: "O carrinho está vazio."
        });
    }


    // Quantidade máxima de itens diferentes
    if (items.length > MAX_ITEMS_PER_ORDER) {
        return res.status(400).json({
            message: "Carrinho com itens demais em um único pedido."
        });
    }


    // Validação dos produtos
    const seenProducts = new Set();
    let totalQuantity = 0;
    for (const item of items) {
        const qty = Number(
            item && item.qty
        );

        const productId = Number(
            item && item.productId
        );


        if (
            !Number.isInteger(productId) ||
            productId <= 0 ||
            seenProducts.has(productId)
        ) {
            return res.status(400).json({
                message: "Item de carrinho inválido."
            });
        }


        if (
            !Number.isInteger(qty) ||
            qty < 1 ||
            qty > MAX_ITEM_QTY
        ) {
            return res.status(400).json({
                message: "Quantidade inválida em algum item do carrinho."
            });
        }
        seenProducts.add(productId);
        totalQuantity += qty;
        if (totalQuantity > 100) return res.status(400).json({ message: "Quantidade total de itens excedida." });
    }


    // ========================================
    // CLIENTE
    // ========================================

    if (
        typeof customer?.name !== "string" ||
        customer.name.trim().length < 2 ||
        customer.name.trim().length > 100
    ) {
        return res.status(400).json({
            message: "Informe um nome válido (2 a 100 caracteres)."
        });
    }


    // E-mail
    const email =
        typeof customer?.email === "string"
            ? customer.email.trim()
            : "";


    if (
        !email ||
        email.length > 190 ||
        !EMAIL_REGEX.test(email)
    ) {
        return res.status(400).json({
            message: "Informe um e-mail válido."
        });
    }


    // Telefone
    if (
        typeof customer?.phone !== "string" ||
        !PHONE_REGEX.test(
            customer.phone.trim()
        )
    ) {
        return res.status(400).json({
            message: "Informe um telefone válido."
        });
    }


    // Endereço
    if (
        typeof customer?.address !== "string" ||
        customer.address.trim().length < 6 ||
        customer.address.trim().length > 300
    ) {
        return res.status(400).json({
            message: "Informe um endereço de entrega válido."
        });
    }


    next();
}


export {
    validateVipInput,
    validateOrderInput
};