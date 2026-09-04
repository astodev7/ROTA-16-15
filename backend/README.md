# Rota 16:15 — Backend

API em Node.js + Express que dá suporte ao site: catálogo de produtos, carrinho/pedidos e lista VIP do Drop 01 ("Ide por Todo o Mundo").

## Estrutura

```
backend/
├── server.js                  # ponto de entrada
├── package.json
├── .env.example
└── src/
    ├── config/
    │   └── database.js        # camada de leitura/escrita (JSON em disco)
    ├── data/
    │   ├── products.json      # catálogo (demonstrativo)
    │   ├── vip-list.json      # inscritos na lista VIP
    │   └── orders.json        # pedidos feitos pelo carrinho
    ├── utils/
    │   └── price.js           # conversão "R$ 129,00" <-> centavos
    ├── models/
    │   ├── product.model.js
    │   ├── vip.model.js
    │   └── order.model.js
    ├── controllers/
    │   ├── product.controller.js
    │   ├── vip.controller.js
    │   ├── order.controller.js    # criação pública de pedidos
    │   └── admin.controller.js    # login + gestão de vip/produtos/pedidos
    ├── routes/
    │   ├── product.routes.js
    │   ├── vip.routes.js
    │   ├── order.routes.js
    │   └── admin.routes.js
    └── middleware/
        ├── validate.js
        ├── auth.js                # login do painel admin + verificação de token
        ├── rateLimiters.js        # limites de requisição por rota
        └── errorHandler.js
```

Armazenamento atual: arquivos JSON em `src/data/` — suficiente pra rodar e testar o site inteiro sem depender de infraestrutura externa. Pra produção, troque só o conteúdo de `src/config/database.js` por um banco de verdade (Postgres, MongoDB etc.); models, controllers e rotas não precisam mudar.

## Como rodar

```bash
cd backend
npm install
cp .env.example .env
npm start
```

No `.env`, gere um hash bcrypt pra senha do admin (mais seguro que texto puro):

```bash
node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA', 12))"
```

Cole o resultado em `ADMIN_PASSWORD_HASH`.

O servidor sobe em `http://localhost:3000` e já serve o `frontend/` estático na raiz — ou seja, abrir `http://localhost:3000` no navegador carrega o site inteiro com a API funcionando. O painel administrativo fica em `http://localhost:3000/admin.html`.

Para desenvolvimento com reload automático:

```bash
npm run dev
```

## Endpoints

| Método | Rota                | Descrição                                      |
|--------|---------------------|-------------------------------------------------|
| GET    | `/api/health`        | Verifica se a API está no ar                    |
| GET    | `/api/products`      | Lista todos os produtos                         |
| GET    | `/api/products?category=camisetas` | Filtra produtos por categoria     |
| POST   | `/api/vip/join`      | Cadastra `{ name, email }` na lista VIP do Drop 01 |
| GET    | `/api/vip/count`     | Retorna quantas pessoas estão na lista (sem expor e-mails) |
| POST   | `/api/orders`         | Cria um pedido a partir do carrinho (veja abaixo) |

### Criar pedido — `POST /api/orders`

```json
{
  "items": [{ "productId": 1, "qty": 2 }, { "productId": 7, "qty": 1 }],
  "customer": {
    "name": "Maria Silva",
    "email": "maria@email.com",
    "phone": "(11) 99999-0000",
    "address": "Rua Exemplo, 123 - Centro - SP, 01000-000"
  }
}
```

O servidor **nunca confia** no nome/preço enviado pelo carrinho — só usa `productId` + `qty` e busca o preço real no catálogo (`products.json`) pra calcular o total. Isso impede que alguém manipule o pedido no navegador pra pagar menos. Não há gateway de pagamento integrado: o pedido fica registrado como `pendente` e a loja combina pagamento/entrega depois, por fora.

### Painel admin (protegido)

| Método | Rota                          | Descrição                                  |
|--------|--------------------------------|---------------------------------------------|
| POST   | `/api/admin/login`             | Recebe `{ password }`, retorna um `token`   |
| POST   | `/api/admin/logout`            | Revoga o token atual                        |
| GET    | `/api/admin/vip`               | Lista completa dos inscritos na VIP         |
| DELETE | `/api/admin/vip/:id`           | Remove um inscrito                          |
| GET    | `/api/admin/products`          | Lista todos os produtos                     |
| POST   | `/api/admin/products`          | Cria produto `{ name, category, price }`    |
| PUT    | `/api/admin/products/:id`      | Edita um produto                            |
| DELETE | `/api/admin/products/:id`      | Remove um produto                           |
| GET    | `/api/admin/orders`            | Lista todos os pedidos                      |
| PUT    | `/api/admin/orders/:id/status` | Atualiza status (`pendente`, `confirmado`, `enviado`, `concluido`, `cancelado`) |
| DELETE | `/api/admin/orders/:id`        | Remove um pedido                            |

Todas as rotas de admin (exceto `/login`) exigem o header `Authorization: Bearer <token>`. O token é um JWT assinado (`JWT_SECRET`) e expira em 4 horas.

O painel visual (`backend/admin/`, servido em `/admin` pelo próprio backend) já consome essa API: aba de **Pedidos** (mudar status, remover), aba de **Lista VIP** (exportar CSV, remover) e aba de **Produtos** (criar/editar/remover).

## Segurança já aplicada

- Senha do admin com hash bcrypt (`ADMIN_PASSWORD_HASH`) — único método suportado, sem fallback em texto puro.
- **2FA (TOTP) opcional** para o login do admin — veja "Ativar 2FA" abaixo.
- `helmet` com CSP restritiva e cabeçalhos de segurança padrão.
- Rate limiting por rota (`rateLimiters.js`): geral, login (força bruta), lista VIP e pedidos.
- CORS obrigatório e explícito em produção (`NODE_ENV=production` recusa iniciar com `CORS_ORIGIN=*`).
- Validação de entrada em todas as rotas públicas (nome, e-mail, telefone, endereço, categoria, preço).
- Preço de pedido sempre recalculado no servidor a partir do catálogo — nunca confia no valor enviado pelo navegador.
- Dependabot + `npm audit` semanal via GitHub Actions (`.github/`).

## Ativar 2FA no login do admin

1. `cd backend && npm install` (instala `otplib`).
2. `node scripts/gerar-qr-2fa.js` — mostra um QR code no terminal e imprime a linha `ADMIN_TOTP_SECRET=...`.
3. Cole essa linha no `.env`.
4. Escaneie o QR com Google Authenticator, Authy ou 1Password.
5. Reinicie o backend. A partir daí, `/api/admin/login` passa a responder `{ requires2FA: true }` quando a senha está certa mas falta o código — o painel já pede o código de 6 dígitos automaticamente.

Para desativar, remova `ADMIN_TOTP_SECRET` do `.env` e reinicie.

## Notas

- Os dados de `products.json` são conteúdo demonstrativo (nomes e preços ilustrativos), como já indicado no frontend.
- `vip-list.json` e `orders.json` guardam dado pessoal de clientes reais assim que o site for usado de verdade — por isso estão no `.gitignore`.
