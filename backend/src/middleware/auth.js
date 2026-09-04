import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


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

    if (hash) {

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
    // SENHA EM TEXTO PURO
    // LEGADO
    // ========================================

    const plain =
        process.env.ADMIN_PASSWORD;


    if (!plain) {
        return false;
    }


    const a =
        Buffer.from(inputPassword);

    const b =
        Buffer.from(plain);


    if (a.length !== b.length) {

        return false;

    }


    return crypto.timingSafeEqual(
        a,
        b
    );

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
    getTokenFromHeader
};