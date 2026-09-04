import supabase from "../../supabase.js";

const TABLE = "produtos";

function toProduct(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.nome,
    category: row.categoria,
    price: Number(row.preco),
    image: row.imagem || null,
    description: row.descricao || null,
    stock: Number(row.estoque ?? 0),
    createdAt: row.criado_em
  };
}

async function getAll() {
  const { data, error } = await supabase.from(TABLE).select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []).map(toProduct);
}

async function getByCategory(category) {
  let query = supabase.from(TABLE).select("*").order("criado_em", { ascending: false });
  if (category && category !== "todos") query = query.eq("categoria", category);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toProduct);
}

async function getById(id) {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", Number(id)).maybeSingle();
  if (error) throw error;
  return toProduct(data);
}

async function add({ name, category, price, image, description, stock }) {
  const { data, error } = await supabase.from(TABLE).insert({
    nome: name.trim(), categoria: category, preco: Number(price),
    imagem: image?.trim() || null, descricao: description?.trim() || null,
    estoque: Number(stock)
  }).select().single();
  if (error) throw error;
  return toProduct(data);
}

async function update(id, { name, category, price, image, description, stock }) {
  const updates = {};
  if (name !== undefined) updates.nome = name.trim();
  if (category !== undefined) updates.categoria = category;
  if (price !== undefined) updates.preco = Number(price);
  if (image !== undefined) updates.imagem = image?.trim() || null;
  if (description !== undefined) updates.descricao = description?.trim() || null;
  if (stock !== undefined) updates.estoque = Number(stock);
  const { data, error } = await supabase.from(TABLE).update(updates).eq("id", Number(id)).select().maybeSingle();
  if (error) throw error;
  return toProduct(data);
}

async function remove(id) {
  const { data, error } = await supabase.from(TABLE).delete().eq("id", Number(id)).select().maybeSingle();
  if (error) throw error;
  return !!data;
}

export { getAll, getByCategory, getById, add, update, remove, toProduct };
