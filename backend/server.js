import "dotenv/config";

import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import productRoutes from "./src/routes/product.routes.js";
import vipRoutes from "./src/routes/vip.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";

import {
    notFound,
    errorHandler
} from "./src/middleware/errorHandler.js";

import {
    apiLimiter
} from "./src/middleware/rateLimiters.js";


// ========================================
// CONFIGURAÇÃO DO __dirname
// ========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ========================================
// APP
// ========================================

const app = express();

const PORT = process.env.PORT || 3000;

const NODE_ENV =
    process.env.NODE_ENV || "development";


// ========================================
// VERIFICAÇÃO DA CONFIGURAÇÃO DO ADMIN
// ========================================

if (
    !process.env.ADMIN_PASSWORD &&
    !process.env.ADMIN_PASSWORD_HASH
) {
    console.error(
        "[FATAL] Defina ADMIN_PASSWORD ou ADMIN_PASSWORD_HASH no .env antes de iniciar o servidor."
    );

    process.exit(1);
}


// ========================================
// TRUST PROXY
// ========================================

// Necessário quando estiver atrás de proxy/load balancer
// como Render, Railway, Nginx etc.

app.set("trust proxy", 1);


// ========================================
// CORS
// ========================================

const CORS_ORIGIN =
    process.env.CORS_ORIGIN;


if (
    NODE_ENV === "production" &&
    (!CORS_ORIGIN || CORS_ORIGIN === "*")
) {
    console.error(
        '[FATAL] Em produção, defina CORS_ORIGIN com o domínio real do site.'
    );

    process.exit(1);
}


app.use(
    cors({
        origin:
            CORS_ORIGIN ||
            (NODE_ENV === "production"
                ? false
                : "*"),

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// ========================================
// HEADERS DE SEGURANÇA
// ========================================

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: ["'self'"],

                styleSrc: [
                    "'self'",
                    "https://fonts.googleapis.com",
                    "'unsafe-inline'"
                ],

                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com"
                ],

                imgSrc: [
                    "'self'",
                    "data:",
                    "https:"
                ],

                connectSrc: [
                    "'self'"
                ],

                objectSrc: [
                    "'none'"
                ],

                baseUri: [
                    "'self'"
                ],

                frameAncestors: [
                    "'self'"
                ]
            }
        },

        crossOriginResourcePolicy: {
            policy: "same-site"
        }
    })
);


// ========================================
// JSON
// ========================================

// Limita o tamanho dos payloads enviados para a API.

app.use(
    express.json({
        limit: "20kb"
    })
);


// ========================================
// RATE LIMIT
// ========================================

app.use(
    "/api",
    apiLimiter
);


// ========================================
// ROTAS DA API
// ========================================

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/vip",
    vipRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);


// ========================================
// HEALTH CHECK
// ========================================

app.get(
    "/api/health",
    (req, res) => {
        res.json({
            status: "ok",
            service: "rota1615-backend",
            integrations: {
                supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
                mercadoPago: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN)
            }
        });
    }
);

// ========================================
// TRATAMENTO DE ERROS
// ========================================

// Rota não encontrada
app.use(
    "/api",
    notFound
);


// Erros internos
app.use(
    errorHandler
);


// ========================================
// EXPORTAR APP
// ========================================

export default app;