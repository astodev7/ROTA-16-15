import rateLimit from "express-rate-limit";


// ========================================
// LIMITE GERAL DA API
// ========================================

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        message: "Muitas requisições. Tente novamente em alguns minutos."
    }
});


// ========================================
// LOGIN DO ADMIN
// ========================================

// 10 tentativas a cada 15 minutos por IP.
// Tentativas bem-sucedidas não contam para o limite.

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    max: 10,

    standardHeaders: true,
    legacyHeaders: false,

    skipSuccessfulRequests: true,

    message: {
        message: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente."
    }
});


// ========================================
// LISTA VIP
// ========================================

// Evita spam no formulário público.

const vipJoinLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora

    max: 20,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        message: "Muitas tentativas. Tente novamente mais tarde."
    }
});


// ========================================
// PEDIDOS
// ========================================

// Evita flood de pedidos falsos.

const orderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora

    max: 15,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        message: "Muitos pedidos em pouco tempo. Tente novamente mais tarde."
    }
});


export {
    apiLimiter,
    loginLimiter,
    vipJoinLimiter,
    orderLimiter
};