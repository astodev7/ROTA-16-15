Copyright © 2026 AstoDev.

All rights reserved.

This repository is public for viewing and portfolio purposes.
No permission is granted to copy, modify, distribute, sublicense,
or use this project or substantial portions of its source code
without prior written permission from the copyright holder.

# Rota 16:15

E-commerce de camisas desenvolvido com frontend, API própria, Supabase e Mercado Pago.

O sistema foi estruturado para separar completamente a interface do cliente, a lógica do servidor e os serviços de dados/pagamento.

---

## 🧱 Arquitetura

```text
rotafinalv3/
│
├── frontend/        → Site + painel administrativo
│
├── backend/         → API Node.js + Express
│
├── package.json
├── .gitignore
└── README.md
```

### Fluxo geral

```text
                    ┌──────────────┐
                    │   FRONTEND   │
                    │ HTML/CSS/JS  │
                    └──────┬───────┘
                           │
                           │ HTTP
                           ▼
                    ┌──────────────┐
                    │    BACKEND   │
                    │ Node + Express│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌─────────────┐
        │ Supabase │ │   JWT    │ │ Mercado Pago│
        │ PostgreSQL│ │  Auth    │ │  Payments   │
        └──────────┘ └──────────┘ └─────────────┘
```

O **Supabase é a fonte de verdade** dos produtos, pedidos e lista VIP.

O navegador nunca recebe:

* `SUPABASE_SECRET_KEY`
* `MERCADOPAGO_ACCESS_TOKEN`
* `JWT_SECRET`
* `ADMIN_PASSWORD_HASH`

---

# 🚀 Tecnologias

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express
* JWT
* bcrypt
* Helmet
* CORS
* express-rate-limit

### Banco

* Supabase
* PostgreSQL
* RPC / funções PostgreSQL

### Pagamentos

* Mercado Pago
* Checkout Pro
* Webhooks

### Deploy

* Vercel
* GitHub

---

# 📁 Backend

```text
backend/
│
├── server.js
├── supabase.js
├── supabase_migration.sql
├── env.example
├── hash.js
├── package.json
│
└── src/
    ├── config/
    ├── controllers/
    ├── data/
    ├── middleware/
    ├── models/
    ├── routes/
    └── utils/
```

A API segue uma separação simples:

```text
Request
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Model / Supabase
   ↓
Response
```

---

# 🔌 API

A API possui cinco áreas principais:

```text
/api/products
/api/vip
/api/orders
/api/admin
/api/payments
```

## Produtos

```http
GET /api/products
```

Obtém os produtos disponíveis para a loja.

O frontend não define o preço oficial dos produtos.

---

## Lista VIP

```http
POST /api/vip/join
GET  /api/vip/count
```

Permite que clientes entrem na lista VIP e consulta a quantidade de inscritos.

---

## Pedidos

```http
POST /api/orders
```

Recebe os dados do cliente e os produtos escolhidos.

O servidor:

1. valida os dados;
2. consulta os produtos no banco;
3. verifica o estoque;
4. calcula o preço real;
5. reserva o estoque;
6. cria o pedido.

O preço enviado pelo frontend **não é considerado confiável**.

---

# 🛒 Fluxo de compra

```text
Cliente
   ↓
Seleciona produtos
   ↓
Carrinho no navegador
   ↓
Checkout
   ↓
POST /api/orders
   ↓
Backend valida pedido
   ↓
PostgreSQL verifica estoque
   ↓
Estoque é reservado
   ↓
Pedido é criado
   ↓
Mercado Pago cria Preference
   ↓
Cliente vai para Checkout Pro
```

O carrinho pode existir no navegador, mas o servidor é responsável por determinar o estado real da compra.

---

# 💳 Pagamentos

O pagamento utiliza o Mercado Pago.

Fluxo:

```text
Frontend
   ↓
Backend
   ↓
Mercado Pago
   ↓
Checkout Pro
   ↓
Cliente paga
   ↓
Webhook
   ↓
Backend
   ↓
Mercado Pago
   ↓
Confirma pagamento
   ↓
Supabase
```

O webhook não confia apenas nos dados enviados pela notificação.

O backend consulta o pagamento diretamente no Mercado Pago antes de alterar o pedido.

### Pagamento aprovado

```text
pedido → confirmado
```

### Pagamento rejeitado/cancelado/estornado

```text
pedido → status correspondente
estoque → devolvido
```

A devolução do estoque deve acontecer apenas uma vez.

---

# 📦 Estoque

O controle de estoque é realizado no PostgreSQL.

Ao criar um pedido, uma RPC é utilizada para:

```text
travar produtos
    ↓
verificar estoque
    ↓
reservar estoque
    ↓
calcular total
    ↓
criar pedido
```

Isso evita problemas de concorrência quando duas pessoas tentam comprar o mesmo produto simultaneamente.

---

# 👨‍💼 Painel administrativo

O painel administrativo utiliza a API protegida.

Rotas:

```http
POST   /api/admin/login
POST   /api/admin/logout

GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id

GET    /api/admin/orders
PUT    /api/admin/orders/:id/status
DELETE /api/admin/orders/:id

GET    /api/admin/vip
DELETE /api/admin/vip/:id
```

---

# 🔐 Autenticação

O administrador faz login através de:

```http
POST /api/admin/login
```

O backend verifica a senha através de `bcrypt`.

Se estiver correta, gera um **JWT**.

```text
Senha
 ↓
bcrypt
 ↓
JWT
 ↓
Frontend
```

Nas requisições administrativas, o token é enviado como:

```http
Authorization: Bearer <TOKEN>
```

O middleware de autenticação valida o JWT antes de permitir acesso às rotas privadas.

---

# 🔒 Segurança

O projeto segue alguns princípios importantes.

### Backend como autoridade

Dados enviados pelo navegador são considerados não confiáveis.

Isso inclui:

* preços;
* quantidades;
* IDs;
* status;
* permissões;
* informações de pedidos.

### Secrets

Credenciais privadas ficam apenas no backend.

### Senha

A senha administrativa não deve ser armazenada em texto puro.

### JWT

A autenticação administrativa utiliza tokens assinados.

### Rate limit

Rotas sensíveis possuem limitação de requisições para reduzir abuso e brute force.

### Helmet

Headers de segurança são adicionados às respostas HTTP.

### CORS

A API aceita requisições apenas das origens configuradas.

---

# 🗄️ Banco de dados

O banco utiliza Supabase/PostgreSQL.

A estrutura inicial pode ser criada através de:

```text
backend/supabase_migration.sql
```

O banco é responsável pelos dados persistentes da aplicação.

Principais entidades:

```text
produtos
pedidos
lista VIP
```

O backend utiliza o Supabase para consultar e modificar esses dados.

---

# ⚙️ Variáveis de ambiente

Crie um `.env` dentro de `backend/`.

Utilize:

```text
backend/env.example
```

como referência.

Principais variáveis:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=

ADMIN_PASSWORD_HASH=
JWT_SECRET=

CORS_ORIGIN=
PUBLIC_BASE_URL=

MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
```

### Nunca faça commit do `.env`.

Credenciais reais devem existir apenas no ambiente local ou nas Environment Variables da Vercel.

---

# 💻 Instalação local

Clone o projeto:

```bash
git clone https://github.com/astodev7/rotafinalv3.git
```

Entre no backend:

```bash
cd rotafinalv3/backend
```

Instale as dependências:

```bash
npm install
```

Configure o `.env`.

Depois execute:

```bash
npm start
```

Para desenvolvimento:

```bash
npm run dev
```

---

# 🧪 Health Check

Para verificar se a API está funcionando:

```http
GET /api/health
```

Resposta esperada:

```json
{
  "ok": true
}
```

---

# ☁️ Deploy

O projeto utiliza Vercel.

A estrutura de deploy é:

```text
GitHub
  │
  ├── frontend → Vercel
  │
  └── backend  → Vercel
```

O backend deve utilizar:

```text
Root Directory: backend
```

O frontend utiliza:

```text
Root Directory: frontend
```

As variáveis de ambiente devem ser configuradas diretamente na Vercel.

---

# 🌐 Produção

Frontend:

```text
https://rota-16-15-v3.vercel.app
```

Backend:

```text
https://rotafinalv3-api.vercel.app
```

O `CORS_ORIGIN` do backend deve apontar para o domínio do frontend.

---

# 🤖 Guia rápido para IA / desenvolvedores

Ao modificar este projeto, siga estas regras:

### 1. Nunca coloque secrets no frontend

Credenciais do Supabase e Mercado Pago pertencem exclusivamente ao backend.

### 2. Nunca confie no preço enviado pelo frontend

Sempre consulte o produto no banco.

### 3. Nunca remova a autenticação das rotas `/api/admin`

Operações administrativas precisam de JWT.

### 4. Não coloque lógica de negócio diretamente no `server.js`

Utilize:

```text
routes
→ middleware
→ controllers
→ models/services
→ database
```

### 5. Alterações no banco

Se uma funcionalidade precisar de uma nova tabela, coluna, função ou RPC, atualize:

```text
backend/supabase_migration.sql
```

### 6. Pagamentos

Nunca marque um pedido como pago apenas porque o frontend informou que o pagamento foi realizado.

O backend deve validar o pagamento através do Mercado Pago.

### 7. Estoque

Alterações de estoque devem permanecer centralizadas na lógica do servidor/banco para evitar inconsistências.

---

# 🧭 Onde encontrar cada funcionalidade

| Funcionalidade        | Local                            |
| --------------------- | -------------------------------- |
| Inicialização da API  | `backend/server.js`              |
| Conexão Supabase      | `backend/supabase.js`            |
| Produtos              | `src/routes/product.routes.js`   |
| Pedidos               | `src/routes/order.routes.js`     |
| VIP                   | `src/routes/vip.routes.js`       |
| Admin                 | `src/routes/admin.routes.js`     |
| Pagamentos            | `src/routes/payment.routes.js`   |
| Controllers           | `src/controllers/`               |
| Autenticação          | `src/middleware/auth.js`         |
| Validação             | `src/middleware/validate.js`     |
| Rate limiting         | `src/middleware/rateLimiters.js` |
| Tratamento de erros   | `src/middleware/errorHandler.js` |
| Banco                 | `supabase_migration.sql`         |
| Variáveis de ambiente | `env.example`                    |

---

# 📌 Resumo

A Rota 16:15 utiliza uma arquitetura separada:

```text
Frontend
   ↓
Express API
   ↓
Controllers / Middleware
   ↓
Supabase PostgreSQL
```

Com serviços externos:

```text
Express
   ├── Supabase → dados
   ├── JWT      → autenticação
   └── Mercado Pago → pagamentos
```

O princípio principal do projeto é:

> **O frontend exibe e solicita. O backend valida e decide. O banco mantém a verdade.**
