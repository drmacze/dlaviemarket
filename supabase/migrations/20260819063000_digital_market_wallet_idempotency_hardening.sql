create or replace function api.dlavie_digital_reserve_wallet(p_wallet_id uuid, p_ref_id text, p_amount bigint)
returns table(balance bigint, reserved boolean)
language plpgsql
security definer
set search_path to 'api','public'
as $$
declare
  v_before bigint;
  v_after bigint;
  v_exists boolean;
begin
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;

  select w.balance into v_before
  from api.dlavie_wallets w
  where w.id=p_wallet_id
  for update;

  if v_before is null then raise exception 'wallet_not_found'; end if;

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

  if v_before < p_amount then raise exception 'insufficient_balance'; end if;

  v_after := v_before - p_amount;
  update api.dlavie_wallets set balance=v_after, updated_at=now() where id=p_wallet_id;
  insert into api.dlavie_wallet_ledger(wallet_id,ref_type,ref_id,direction,amount,balance_before,balance_after,idempotency_key)
  values(p_wallet_id,'digital_order',p_ref_id,'debit',p_amount,v_before,v_after,'digital:debit:'||p_ref_id);

  return query select v_after, true;
end $$;

create or replace function api.dlavie_digital_refund_wallet(p_wallet_id uuid, p_ref_id text, p_amount bigint, p_reason text default 'supplier_failed'::text)
returns table(balance bigint, refunded boolean)
language plpgsql
security definer
set search_path to 'api','public'
as $$
declare
  v_before bigint;
  v_after bigint;
  v_exists boolean;
begin
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;

  select w.balance into v_before
  from api.dlavie_wallets w
  where w.id=p_wallet_id
  for update;

  if v_before is null then raise exception 'wallet_not_found'; end if;

  select exists(
    select 1
    from api.dlavie_wallet_ledger
    where wallet_id=p_wallet_id
      and idempotency_key='digital:credit:'||p_ref_id
  ) into v_exists;

  if v_exists then
    return query select v_before, false;
    return;
  end if;

  if not exists(
    select 1
    from api.dlavie_wallet_ledger
    where wallet_id=p_wallet_id
      and idempotency_key='digital:debit:'||p_ref_id
  ) then raise exception 'debit_not_found'; end if;

  v_after := v_before + p_amount;
  update api.dlavie_wallets set balance=v_after, updated_at=now() where id=p_wallet_id;
  insert into api.dlavie_wallet_ledger(wallet_id,ref_type,ref_id,direction,amount,balance_before,balance_after,idempotency_key,metadata)
  values(p_wallet_id,'digital_order',p_ref_id,'credit',p_amount,v_before,v_after,'digital:credit:'||p_ref_id,jsonb_build_object('reason',coalesce(p_reason,'supplier_failed')));

  return query select v_after, true;
end $$;
