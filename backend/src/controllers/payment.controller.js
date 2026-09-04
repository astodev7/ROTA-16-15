import * as productModel from "../models/product.model.js";
import * as orderModel from "../models/order.model.js";
import { preferenceClient, paymentClient, WebhookSignatureValidator, InvalidWebhookSignatureError, getNotificationUrl } from "../config/mercadopago.js";

function requireMercadoPago() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

  if (!token) {
    const error = new Error(
      "Mercado Pago não configurado: MERCADOPAGO_ACCESS_TOKEN está vazio ou não foi carregado pelo backend. Pare e reinicie o servidor depois de preencher o .env."
    );
    error.status = 503;
    throw error;
  }

  if (!preferenceClient || !paymentClient) {
    const error = new Error(
      "Mercado Pago não pôde ser inicializado. Confira a instalação do pacote mercadopago e reinicie o backend."
    );
    error.status = 503;
    throw error;
  }
}

function baseUrl() { return (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, ""); }

async function createCheckout(req, res, next) {
  try {
    requireMercadoPago();
    const { items, customer } = req.body;
    const order = await orderModel.createWithReservation({ items, customer });
    if (!order) throw new Error("Não foi possível criar o pedido.");

    const url = baseUrl();
    const body = {
      items: order.items.map(item => ({
        id: String(item.productId), title: item.name, quantity: Number(item.qty),
        currency_id: "BRL", unit_price: Number(item.unitPrice)
      })),
      payer: { name: customer.name, email: customer.email },
      external_reference: order.publicToken,
      ...(getNotificationUrl().startsWith("http") ? { notification_url: getNotificationUrl() } : {}),
      ...(url ? { back_urls: {
        success: `${url}/?payment=success&ref=${encodeURIComponent(order.publicToken)}`,
        pending: `${url}/?payment=pending&ref=${encodeURIComponent(order.publicToken)}`,
        failure: `${url}/?payment=failure&ref=${encodeURIComponent(order.publicToken)}`
      } } : {}),
      ...(url ? { auto_return: "approved" } : {}),
      statement_descriptor: "ROTA1615"
    };

    let preference;
    try {
      preference = await preferenceClient.create({ body });
    } catch (error) {
      await orderModel.restoreStock(order.id).catch(() => {});
      await orderModel.updateStatus(order.id, "cancelado").catch(() => {});
      throw error;
    }
    const saved = await orderModel.setPaymentInfo(order.id, { preferenceId: preference.id, paymentStatus: "pending" });

    res.status(201).json({
      order: { id: saved.id, publicToken: saved.publicToken, total: saved.total },
      preferenceId: preference.id, initPoint: preference.init_point, sandboxInitPoint: preference.sandbox_init_point || null
    });
  } catch (error) {
    next(error);
  }
}

async function paymentStatus(req, res, next) {
  try {
    const order = await orderModel.getByPublicToken(req.params.ref);
    if (!order) return res.status(404).json({ message: "Pedido não encontrado." });
    res.json({ id: order.id, status: order.status, paymentStatus: order.paymentStatus, total: order.total });
  } catch (error) { next(error); }
}

async function webhook(req, res, next) {
  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret) {
      try {
        WebhookSignatureValidator.validate({
          xSignature: req.headers["x-signature"],
          xRequestId: req.headers["x-request-id"],
          dataId: req.query["data.id"],
          secret
        });
      } catch (error) {
        if (error instanceof InvalidWebhookSignatureError) return res.sendStatus(401);
        throw error;
      }
    }

    const type = req.body?.type || req.query?.type;
    const paymentId = req.body?.data?.id || req.query?.["data.id"];
    if (type !== "payment" || !paymentId) return res.sendStatus(200);

    requireMercadoPago();
    const payment = await paymentClient.get({ id: String(paymentId) });
    const publicToken = payment.external_reference;
    if (!publicToken) return res.sendStatus(200);

    const order = await orderModel.getByPublicToken(publicToken);
    if (!order) return res.sendStatus(200);

    const mpStatus = String(payment.status || "pending");
    const allowed = ["approved", "pending", "rejected", "cancelled", "refunded"];
    const paymentStatus = allowed.includes(mpStatus) ? mpStatus : "pending";

    await orderModel.setPaymentInfo(order.id, { paymentId: String(payment.id), paymentStatus });

    if (paymentStatus === "approved" && order.status === "pendente") {
      await orderModel.updateStatus(order.id, "confirmado");
    }
    if (["rejected", "cancelled"].includes(paymentStatus) && order.status !== "cancelado") {
      await orderModel.restoreStock(order.id);
      await orderModel.updateStatus(order.id, "cancelado");
    }

    return res.sendStatus(200);
  } catch (error) { next(error); }
}

export { createCheckout, paymentStatus, webhook };
