create or replace function api.dlavie_digital_claim_order(
  p_wallet_id uuid,
  p_user_id text,
  p_product_kind text,
  p_sku text,
  p_product_name text,
  p_category text,
  p_brand text,
  p_product_type text,
  p_customer_no text,
  p_base_price bigint,
  p_sell_price bigint,
  p_environment text,
  p_ref_id text,
  p_dedupe_seconds integer default 30
)
returns table(order_id uuid, ref_id text, created boolean)
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_order_id uuid;
  v_ref_id text;
  v_seconds integer := greatest(5, least(coalesce(p_dedupe_seconds,30), 120));
  v_lock_key text;
begin
  if p_wallet_id is null or nullif(trim(p_user_id),'') is null or nullif(trim(p_sku),'') is null or nullif(trim(p_customer_no),'') is null then
    raise exception 'invalid_order_intent';
  end if;
  if p_product_kind not in ('prepaid','postpaid') then
    raise exception 'invalid_product_kind';
  end if;

  v_lock_key := concat_ws('|', p_wallet_id::text, trim(p_user_id), p_product_kind, trim(p_sku), trim(p_customer_no));
  perform pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));

  select o.id, o.ref_id
    into v_order_id, v_ref_id
  from api.dlavie_digital_orders o
  where o.wallet_id = p_wallet_id
    and o.user_id = trim(p_user_id)
    and o.product_kind = p_product_kind
    and o.sku = trim(p_sku)
    and o.customer_no = trim(p_customer_no)
    and (
      (o.status in ('created','reserved','pending') and o.created_at >= now() - interval '1 day')
      or
      (o.status in ('success','inquired') and o.created_at >= now() - make_interval(secs => v_seconds))
    )
  order by
    case when o.status in ('created','reserved','pending') then 0 else 1 end,
    o.created_at desc
  limit 1;

  if v_order_id is not null then
    return query select v_order_id, v_ref_id, false;
    return;
  end if;

  insert into api.dlavie_digital_orders(
    ref_id,wallet_id,user_id,product_kind,sku,product_name,category,brand,product_type,
    customer_no,base_price,sell_price,status,environment,created_at,updated_at
  ) values (
    trim(p_ref_id),p_wallet_id,trim(p_user_id),p_product_kind,trim(p_sku),trim(p_product_name),
    trim(p_category),trim(p_brand),nullif(trim(coalesce(p_product_type,'')),''),trim(p_customer_no),
    greatest(0,p_base_price),greatest(0,p_sell_price),'created',p_environment,now(),now()
  ) returning id, api.dlavie_digital_orders.ref_id into v_order_id, v_ref_id;

  return query select v_order_id, v_ref_id, true;
end $$;

revoke all on function api.dlavie_digital_claim_order(uuid,text,text,text,text,text,text,text,text,bigint,bigint,text,text,integer) from public, anon, authenticated;
grant execute on function api.dlavie_digital_claim_order(uuid,text,text,text,text,text,text,text,text,bigint,bigint,text,text,integer) to service_role;
