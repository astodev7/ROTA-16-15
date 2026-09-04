-- ROTA 16:15 - produção com Supabase/PostgreSQL
-- Rode no SQL Editor do Supabase. O script é idempotente na medida do possível.

-- Produtos (a tabela já existe no projeto)
alter table public.produtos add column if not exists descricao text;
alter table public.produtos add column if not exists imagem text;
alter table public.produtos add column if not exists estoque integer not null default 0;
alter table public.produtos add column if not exists criado_em timestamptz not null default now();

-- VIP
alter table public.lista_vip add column if not exists criado_em timestamptz not null default now();

-- Pedidos: mantém nome/email/telefone/endereco e adiciona o que o checkout precisa.
alter table public.pedidos add column if not exists public_token uuid;
alter table public.pedidos add column if not exists itens jsonb not null default '[]'::jsonb;
alter table public.pedidos add column if not exists total numeric(12,2) not null default 0;
alter table public.pedidos add column if not exists status text not null default 'pendente';
alter table public.pedidos add column if not exists payment_status text not null default 'pending';
alter table public.pedidos add column if not exists mercadopago_preference_id text;
alter table public.pedidos add column if not exists mercadopago_payment_id text;
alter table public.pedidos add column if not exists estoque_reservado boolean not null default false;
alter table public.pedidos add column if not exists estoque_devolvido boolean not null default false;
alter table public.pedidos add column if not exists criado_em timestamptz not null default now();

update public.pedidos set public_token = gen_random_uuid() where public_token is null;
create unique index if not exists pedidos_public_token_uidx on public.pedidos(public_token);
create index if not exists pedidos_payment_id_idx on public.pedidos(mercadopago_payment_id);
create index if not exists pedidos_status_idx on public.pedidos(status);

alter table public.pedidos drop constraint if exists pedidos_status_check;
alter table public.pedidos add constraint pedidos_status_check check (status in ('pendente','confirmado','enviado','concluido','cancelado'));
alter table public.pedidos drop constraint if exists pedidos_payment_status_check;
alter table public.pedidos add constraint pedidos_payment_status_check check (payment_status in ('pending','approved','rejected','cancelled','refunded','error'));

-- Garante unicidade de e-mail na VIP quando possível.
create unique index if not exists lista_vip_email_uidx on public.lista_vip(lower(email));

-- RPC atômica: valida produtos, trava linhas, reserva estoque e cria pedido.
create or replace function public.criar_pedido(
  p_items jsonb, p_nome text, p_email text, p_telefone text, p_endereco text, p_public_token uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  raw jsonb; product_row public.produtos%rowtype;
  pid bigint; qty integer; total_value numeric(12,2) := 0;
  resolved jsonb := '[]'::jsonb; new_id bigint;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Carrinho vazio'; end if;

  for raw in select * from jsonb_array_elements(p_items) loop
    pid := (raw->>'productId')::bigint; qty := (raw->>'qty')::integer;
    if pid is null or qty is null or qty < 1 or qty > 20 then raise exception 'Item inválido'; end if;

    select * into product_row from public.produtos where id = pid for update;
    if not found then raise exception 'Produto não encontrado: %', pid; end if;
    if coalesce(product_row.estoque,0) < qty then raise exception 'Estoque insuficiente para o produto: %', product_row.nome; end if;
    if product_row.preco is null or product_row.preco < 0 then raise exception 'Preço inválido para o produto: %', product_row.nome; end if;

    update public.produtos set estoque = estoque - qty where id = pid;
    total_value := total_value + (product_row.preco * qty);
    resolved := resolved || jsonb_build_array(jsonb_build_object(
      'productId', product_row.id, 'name', product_row.nome, 'category', product_row.categoria,
      'unitPrice', product_row.preco, 'qty', qty, 'image', product_row.imagem
    ));
  end loop;

  insert into public.pedidos (public_token,nome,email,telefone,endereco,itens,total,status,payment_status,estoque_reservado,estoque_devolvido,criado_em)
  values (p_public_token,trim(p_nome),lower(trim(p_email)),trim(p_telefone),trim(p_endereco),resolved,total_value,'pendente','pending',true,false,now())
  returning id into new_id;

  return jsonb_build_object('id',new_id,'public_token',p_public_token,'itens',resolved,'total',total_value,'status','pendente','payment_status','pending','criado_em',now());
exception when others then
  raise;
end;
$$;

-- Devolve estoque no máximo uma vez por pedido.
create or replace function public.devolver_estoque_pedido(p_pedido_id bigint) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare order_row public.pedidos%rowtype; item jsonb;
begin
  select * into order_row from public.pedidos where id=p_pedido_id for update;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if order_row.estoque_devolvido or not order_row.estoque_reservado then return false; end if;
  for item in select * from jsonb_array_elements(order_row.itens) loop
    update public.produtos set estoque = estoque + (item->>'qty')::integer where id=(item->>'productId')::bigint;
  end loop;
  update public.pedidos set estoque_devolvido=true where id=p_pedido_id;
  return true;
end;
$$;

-- O backend usa a SECRET_KEY, então RLS pode continuar ativo sem expor credenciais privilegiadas ao navegador.
-- Se suas tabelas ainda não têm RLS, ative-o e não crie policies públicas de INSERT/UPDATE/DELETE.
alter table public.produtos enable row level security;
alter table public.lista_vip enable row level security;
alter table public.pedidos enable row level security;


revoke all on function public.criar_pedido(jsonb,text,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.criar_pedido(jsonb,text,text,text,text,uuid) to service_role;
revoke all on function public.devolver_estoque_pedido(bigint) from public, anon, authenticated;
grant execute on function public.devolver_estoque_pedido(bigint) to service_role;
