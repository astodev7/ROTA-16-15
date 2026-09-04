import crypto from "crypto";
import bcrypt from "bcryptjs";

// Tokens válidos ficam em memória.
// Em produção com múltiplas instâncias do servidor,
// considere usar sessões/JWT com persistência compartilhada.
const TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

const validTokens = new Map();


// ========================================
// TOKENS
// ========================================

function issueToken() {
    const token = crypto.randomBytes(32).toString("hex");

    validTokens.set(
        token,
        Date.now() + TOKEN_TTL_MS
    );

    return token;
}


function revokeToken(token) {
    validTokens.delete(token);
}


function isValidToken(token) {
    if (!token || !validTokens.has(token)) {
        return false;
    }

    const expiresAt = validTokens.get(token);

    if (Date.now() > expiresAt) {
        validTokens.delete(token);
        return false;
    }

    return true;
}


function getTokenFromHeader(req) {
    const header = req.headers.authorization || "";

    return header.startsWith("Bearer ")
        ? header.slice(7)
        : null;
}


// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

function adminAuth(req, res, next) {
    const token = getTokenFromHeader(req);

    if (!isValidToken(token)) {
        return res.status(401).json({
            message: "Sessão inválida ou expirada. Faça login novamente."
        });
    }

    next();
}


// ========================================
// SENHA DO ADMIN
// ========================================

async function verifyAdminPassword(inputPassword) {
    if (
        typeof inputPassword !== "string" ||
        !inputPassword
    ) {
        return false;
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;

    // Hash bcrypt tem prioridade
    if (hash) {
        return bcrypt.compare(
            inputPassword,
            hash
        );
    }

    // Senha em texto puro — legado
    const plain = process.env.ADMIN_PASSWORD;

    if (!plain) {
        return false;
    }

    const a = Buffer.from(inputPassword);
    const b = Buffer.from(plain);

    // timingSafeEqual exige buffers do mesmo tamanho.
    if (a.length !== b.length) {
        crypto.timingSafeEqual(a, a);
        return false;
    }

    return crypto.timingSafeEqual(a, b);
}


export {
    issueToken,
    revokeToken,
    adminAuth,
    verifyAdminPassword,
    getTokenFromHeader
};