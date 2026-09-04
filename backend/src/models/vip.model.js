import supabase from "../../supabase.js";

const TABLE = "lista_vip";

// Aceita tanto o padrão usado pela migration deste projeto
// quanto tabelas VIP já existentes no Supabase.
function toVip(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.nome ?? row.name ?? "",
    email: row.email ?? "",
    createdAt: row.criado_em ?? row.created_at ?? row.data_inscricao ?? row.createdAt ?? null
  };
}

async function getAll() {
  // Não dependemos de criado_em para a leitura: isso permite que a lista
  // continue funcionando mesmo se a tabela original ainda não tiver
  // recebido a coluna adicionada pela migration.
  const { data, error } = await supabase.from(TABLE).select("*");
  if (error) throw error;

  return (data || [])
    .map(toVip)
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
}

async function count() {
  const { count, error } = await supabase.from(TABLE).select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

async function existsByEmail(email) {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.from(TABLE).select("id").ilike("email", normalized).maybeSingle();
  if (error) throw error;
  return !!data;
}

async function add({ name, email }) {
  const { data, error } = await supabase.from(TABLE).insert({
    nome: name.trim(),
    email: email.trim().toLowerCase()
  }).select().single();
  if (error) throw error;
  return toVip(data);
}

async function removeById(id) {
  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select().maybeSingle();
  if (error) throw error;
  return !!data;
}

export { getAll, count, existsByEmail, add, removeById };
