// Gera um segredo TOTP novo e mostra um QR code no terminal
// pra você escanear com o app autenticador.
//
// Uso:
//   cd backend
//   node scripts/gerar-qr-2fa.js
//
// Depois:
//   1. Copie o "ADMIN_TOTP_SECRET=" impresso e cole no seu .env
//   2. Escaneie o QR com o app autenticador
//   3. Reinicie o backend — o login passa a pedir o código de 6 dígitos

import { authenticator } from "otplib";
import qrcode from "qrcode-terminal";

const secret = authenticator.generateSecret();
const issuer = "Rota 16:15 Admin";
const account = "admin";

const otpauthUrl = authenticator.keyuri(account, issuer, secret);

console.log("\n=== 2FA — Rota 16:15 ===\n");
console.log("Adicione esta linha ao backend/.env:\n");
console.log(`ADMIN_TOTP_SECRET=${secret}\n`);
console.log("Escaneie este QR code com Google Authenticator / Authy / 1Password:\n");

qrcode.generate(otpauthUrl, { small: true });

console.log("\nSe preferir digitar manualmente no app, o segredo é:", secret, "\n");
