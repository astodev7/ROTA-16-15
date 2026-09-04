# Rota 16:15 — loja + Supabase + Mercado Pago

O projeto agora usa o Supabase como fonte de verdade para produtos, lista VIP e pedidos. O navegador nunca recebe a chave secreta do Supabase nem o Access Token do Mercado Pago.

## Estrutura
- `frontend/`: site e painel admin
- `backend/`: Express API
- `backend/supabase_migration.sql`: estrutura/rotinas necessárias no banco

## Configuração
1. Rode `backend/supabase_migration.sql` no SQL Editor do Supabase.
2. Copie `backend/.env.example` para `.env`.
3. Preencha `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD_HASH`, `MERCADOPAGO_ACCESS_TOKEN` e, em produção, `PUBLIC_BASE_URL`/`CORS_ORIGIN`.
4. No Mercado Pago, configure o Webhook de pagamentos para `https://SEU_DOMINIO/api/payments/webhook` e copie a chave secreta para `MERCADOPAGO_WEBHOOK_SECRET`.
5. `npm install` e `npm start` dentro de `backend/`.

## Fluxo real
1. O catálogo vem de `produtos`.
2. O carrinho fica no navegador, mas o servidor ignora nomes/preços do cliente.
3. Ao finalizar, o backend chama uma RPC PostgreSQL que trava os produtos, confere estoque, reserva estoque, calcula o total e grava `pedidos`.
4. O backend cria uma Preference do Mercado Pago e redireciona o cliente para o Checkout Pro.
5. O Webhook valida a assinatura e consulta o pagamento diretamente no Mercado Pago.
6. Pagamento aprovado -> pedido `confirmado`. Rejeitado/cancelado/estornado -> estoque é devolvido uma única vez.
7. O admin lê e altera tudo pelo Supabase através da API protegida.

## Importante
O `PUBLIC_BASE_URL` precisa ser um domínio público em produção. O Mercado Pago não aceita `localhost` como `back_urls`/`notification_url` para esse fluxo.
