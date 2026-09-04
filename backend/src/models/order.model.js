import crypto from "crypto";
import supabase from "../../supabase.js";

const TABLE = "pedidos";
const VALID_STATUSES = ["pendente", "confirmado", "enviado", "concluido", "cancelado"];
const VALID_PAYMENT_STATUSES = ["pending", "approved", "rejected", "cancelled", "refunded", "error"];

function toOrder(row) {
  if (!row) return null;
  const items = Array.isArray(row.itens) ? row.itens : [];
  return {
    id: Number(row.id), publicToken: row.public_token, items,
    customer: { name: row.nome, email: row.email, phone: row.telefone, address: row.endereco },
    total: Number(row.total), status: row.status, paymentStatus: row.payment_status || "pending",
    preferenceId: row.mercadopago_preference_id || null, paymentId: row.mercadopago_payment_id || null,
    createdAt: row.criado_em
  };
}

async function getAll() {
  const { data, error } = await supabase.from(TABLE).select("*").order("criado_em", { ascending: false });
  if (error) throw error; return (data || []).map(toOrder);
}
async function getById(id) {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", Number(id)).maybeSingle();
  if (error) throw error; return toOrder(data);
}
async function getByPublicToken(token) {
  const { data, error } = await supabase.from(TABLE).select("*").eq("public_token", token).maybeSingle();
  if (error) throw error; return toOrder(data);
}

async function createWithReservation({ items, customer }) {
  const publicToken = crypto.randomUUID();
  const { data, error } = await supabase.rpc("criar_pedido", {
    p_items: items, p_nome: customer.name, p_email: customer.email,
    p_telefone: customer.phone, p_endereco: customer.address, p_public_token: publicToken
  });
  if (error) throw error;
  return toOrder(data);
}

async function setPaymentInfo(id, { preferenceId, paymentId, paymentStatus }) {
  const updates = {};
  if (preferenceId !== undefined) updates.mercadopago_preference_id = preferenceId;
  if (paymentId !== undefined) updates.mercadopago_payment_id = paymentId;
  if (paymentStatus !== undefined) updates.payment_status = paymentStatus;
  const { data, error } = await supabase.from(TABLE).update(updates).eq("id", Number(id)).select().maybeSingle();
  if (error) throw error; return toOrder(data);
}

async function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) return null;
  const { data, error } = await supabase.from(TABLE).update({ status }).eq("id", Number(id)).select().maybeSingle();
  if (error) throw error; return toOrder(data);
}

async function restoreStock(id) {
  const { data, error } = await supabase.rpc("devolver_estoque_pedido", { p_pedido_id: Number(id) });
  if (error) throw error; return data;
}

async function remove(id) {
  const { data, error } = await supabase.from(TABLE).delete().eq("id", Number(id)).select().maybeSingle();
  if (error) throw error; return !!data;
}

export { getAll, getById, getByPublicToken, createWithReservation, setPaymentInfo, updateStatus, restoreStock, remove, VALID_STATUSES, VALID_PAYMENT_STATUSES };
