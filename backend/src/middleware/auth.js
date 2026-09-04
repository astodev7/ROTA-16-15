import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";


// ========================================
// CONFIGURAÇÃO
// ========================================

const TOKEN_TTL = "4h";

const JWT_SECRET = process.env.JWT_SECRET;


// ========================================
// VERIFICAÇÃO DA CONFIGURAÇÃO
// ========================================

if (!JWT_SECRET) {
    console.error(
        "[FATAL] JWT_SECRET não configurado."
    );

    if (process.env.NODE_ENV === "production") {
        process.exit(1);
    }
}


// ========================================
// TOKENS
// ========================================

function issueToken() {

    return jwt.sign(
        {
            role: "admin"
        },
        JWT_SECRET,
        {
            expiresIn: TOKEN_TTL,
            issuer: "rota1615-api",
            subject: "admin"
        }
    );

}


function revokeToken(token) {

    // JWT é stateless.
    // Não precisamos armazenar tokens em memória.
    //
    // A invalidação acontece naturalmente quando
    // o token expira.
    //
    // O logout no frontend remove o token do sessionStorage.

    return true;

}


// ========================================
// VALIDAÇÃO DO TOKEN
// ========================================

function isValidToken(token) {

    if (!token || !JWT_SECRET) {
        return false;
    }

    try {

        const payload = jwt.verify(
            token,
            JWT_SECRET,
            {
                issuer: "rota1615-api",
                subject: "admin"
            }
        );

        return (
            payload &&
            payload.role === "admin"
        );

    } catch (error) {

        return false;

    }

}


// ========================================
// TOKEN DO HEADER
// ========================================

function getTokenFromHeader(req) {

    const header =
        req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return null;
    }

    return header.slice(7).trim();

}


// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

function adminAuth(req, res, next) {

    const token =
        getTokenFromHeader(req);

    if (!isValidToken(token)) {

        return res.status(401).json({
            message:
                "Sessão inválida ou expirada. Faça login novamente."
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


    const hash =
        process.env.ADMIN_PASSWORD_HASH;


    // ========================================
    // BCRYPT
    // ========================================
    // Único método suportado. A senha em texto puro (ADMIN_PASSWORD)
    // foi removida: nunca compare senhas sem hash, mesmo com
    // timingSafeEqual — o hash é o que impede vazamento em texto
    // plano caso o .env ou uma variável de ambiente vaze.

    if (!hash) {
        return false;
    }

    try {

        return await bcrypt.compare(
            inputPassword,
            hash
        );

    } catch (error) {

        console.error(
            "[AUTH] Erro ao verificar senha:",
            error
        );

        return false;

    }

}


// ========================================
// 2FA (TOTP) — RFC 6238
// ========================================
//
// Opcional: só entra em vigor se ADMIN_TOTP_SECRET estiver
// definido no .env. Sem essa variável, o login continua
// exigindo só a senha (comportamento anterior).
//
// Gerar um segredo novo (rodar uma vez, localmente):
//   node -e "console.log(require('otplib').authenticator.generateSecret())"
//
// Depois de colar o valor em ADMIN_TOTP_SECRET, cadastre o mesmo
// segredo no app autenticador (Google Authenticator, Authy, etc.)
// escaneando um QR gerado a partir da otpauth URL — veja
// scripts/gerar-qr-2fa.js.

authenticator.options = { window: 1 }; // tolera 1 passo (±30s) de dessincronia de relógio

function isTwoFactorEnabled() {
    return Boolean(process.env.ADMIN_TOTP_SECRET);
}

function verifyTotpCode(code) {

    const secret = process.env.ADMIN_TOTP_SECRET;

    if (!secret || typeof code !== "string" || !/^\d{6}$/.test(code)) {
        return false;
    }

    try {
        return authenticator.check(code, secret);
    } catch (error) {
        console.error("[AUTH] Erro ao verificar código 2FA:", error);
        return false;
    }

}


// ========================================
// EXPORTS
// ========================================

export {
    issueToken,
    revokeToken,
    isValidToken,
    adminAuth,
    verifyAdminPassword,
    getTokenFromHeader,
    isTwoFactorEnabled,
    verifyTotpCode
};