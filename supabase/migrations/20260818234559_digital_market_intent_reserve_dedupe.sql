create or replace function api.dlavie_digital_reserve_wallet(p_wallet_id uuid, p_ref_id text, p_amount bigint)
returns table(balance bigint, reserved boolean)
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_before bigint;
  v_after bigint;
  v_exists boolean;
  v_user_id text;
  v_kind text;
  v_sku text;
  v_customer text;
  v_created_at timestamptz;
  v_duplicate_ref text;
  v_lock_key text;
begin
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;

  select w.balance into v_before
  from api.dlavie_wallets w
  where w.id=p_wallet_id
  for update;

  if v_before is null then raise exception 'wallet_not_found'; end if;

  select o.user_id,o.product_kind,o.sku,o.customer_no,o.created_at
    into v_user_id,v_kind,v_sku,v_customer,v_created_at
  from api.dlavie_digital_orders o
  where o.wallet_id=p_wallet_id and o.ref_id=p_ref_id
  for update;

  if v_user_id is null then raise exception 'digital_order_not_found'; end if;

  v_lock_key := concat_ws('|',p_wallet_id::text,v_user_id,v_kind,v_sku,v_customer);
  perform pg_advisory_xact_lock(hashtextextended(v_lock_key,0));

  select exists(
    select 1
    from api.dlavie_wallet_ledger
    where wallet_id=p_wallet_id
      and idempotency_key='digital:debit:'||p_ref_id
  ) into v_exists;

  if v_exists then
    return query select v_before, false;
    return;
  end if;

  select o.ref_id into v_duplicate_ref
  from api.dlavie_digital_orders o
  join api.dlavie_wallet_ledger l
    on l.wallet_id=o.wallet_id
   and l.idempotency_key='digital:debit:'||o.ref_id
  where o.wallet_id=p_wallet_id
    and o.user_id=v_user_id
    and o.product_kind=v_kind
    and o.sku=v_sku
    and o.customer_no=v_customer
    and o.ref_id<>p_ref_id
    and o.status not in ('failed','refunded')
    and o.created_at between v_created_at - interval '20 seconds' and v_created_at
  order by o.created_at desc
  limit 1;

  if v_duplicate_ref is not null then
    update api.dlavie_digital_orders
      set status='failed',
          message='Permintaan duplikat dicegah. Gunakan transaksi sebelumnya.',
          supplier_request_id=v_duplicate_ref,
          gateway_forwarded=false,
          updated_at=now()
    where wallet_id=p_wallet_id and ref_id=p_ref_id and status='created';
    return query select v_before, false;
    return;
  end if;

  if v_before < p_amount then raise exception 'insufficient_balance'; end if;

  v_after := v_before - p_amount;
  update api.dlavie_wallets set balance=v_after, updated_at=now() where id=p_wallet_id;
  insert into api.dlavie_wallet_ledger(wallet_id,ref_type,ref_id,direction,amount,balance_before,balance_after,idempotency_key)
  values(p_wallet_id,'digital_order',p_ref_id,'debit',p_amount,v_before,v_after,'digital:debit:'||p_ref_id);

  return query select v_after, true;
end $$;
