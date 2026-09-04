import { MercadoPagoConfig, Preference, Payment, WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const mercadopago = accessToken ? new MercadoPagoConfig({ accessToken }) : null;
const preferenceClient = mercadopago ? new Preference(mercadopago) : null;
const paymentClient = mercadopago ? new Payment(mercadopago) : null;

function getNotificationUrl() {
  return process.env.MERCADOPAGO_NOTIFICATION_URL || `${process.env.PUBLIC_BASE_URL || ""}/api/payments/webhook`;
}

export { mercadopago, preferenceClient, paymentClient, WebhookSignatureValidator, InvalidWebhookSignatureError, getNotificationUrl };
