create table if not exists api.dlavie_h2h_sandbox_wallets (
  wallet_id uuid primary key references api.dlavie_wallets(id) on delete cascade,
  balance bigint not null default 1000000 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists api.dlavie_h2h_sandbox_ledger (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references api.dlavie_wallets(id) on delete cascade,
  ref_id text not null,
  direction text not null check (direction in ('debit','credit')),
  amount bigint not null check (amount > 0),
  balance_before bigint not null,
  balance_after bigint not null,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dlavie_h2h_sandbox_ledger_wallet_created_idx
  on api.dlavie_h2h_sandbox_ledger(wallet_id, created_at desc);
create index if not exists dlavie_h2h_sandbox_ledger_ref_idx
  on api.dlavie_h2h_sandbox_ledger(ref_id);

alter table api.dlavie_h2h_sandbox_wallets enable row level security;
alter table api.dlavie_h2h_sandbox_ledger enable row level security;

revoke all on api.dlavie_h2h_sandbox_wallets from anon, authenticated;
revoke all on api.dlavie_h2h_sandbox_ledger from anon, authenticated;
grant select, insert, update, delete on api.dlavie_h2h_sandbox_wallets to service_role;
grant select, insert, update, delete on api.dlavie_h2h_sandbox_ledger to service_role;

create or replace function api.dlavie_h2h_sandbox_balance(p_wallet_id uuid)
returns bigint
language plpgsql
security definer
set search_path = api, public
as $$
declare v_balance bigint;
begin
  insert into api.dlavie_h2h_sandbox_wallets(wallet_id)
  values (p_wallet_id)
  on conflict (wallet_id) do nothing;
  select balance into v_balance
  from api.dlavie_h2h_sandbox_wallets
  where wallet_id = p_wallet_id;
  return coalesce(v_balance, 1000000);
end;
$$;

create or replace function api.dlavie_h2h_sandbox_reserve(p_wallet_id uuid, p_ref_id text, p_amount bigint)
returns table(balance bigint, reserved boolean)
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_before bigint;
  v_after bigint;
  v_key text := 'sandbox:debit:' || p_ref_id;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  insert into api.dlavie_h2h_sandbox_wallets(wallet_id)
  values (p_wallet_id)
  on conflict (wallet_id) do nothing;

  if exists(select 1 from api.dlavie_h2h_sandbox_ledger where idempotency_key=v_key) then
    select w.balance into v_after from api.dlavie_h2h_sandbox_wallets w where w.wallet_id=p_wallet_id;
    return query select v_after, false;
    return;
  end if;

  select w.balance into v_before
  from api.dlavie_h2h_sandbox_wallets w
  where w.wallet_id=p_wallet_id
  for update;
  if v_before < p_amount then raise exception 'sandbox_insufficient_balance'; end if;
  v_after := v_before - p_amount;
  update api.dlavie_h2h_sandbox_wallets
    set balance=v_after, updated_at=now()
    where wallet_id=p_wallet_id;
  insert into api.dlavie_h2h_sandbox_ledger(wallet_id,ref_id,direction,amount,balance_before,balance_after,idempotency_key,metadata)
    values(p_wallet_id,p_ref_id,'debit',p_amount,v_before,v_after,v_key,jsonb_build_object('mode','sandbox'));
  return query select v_after, true;
end;
$$;

create or replace function api.dlavie_h2h_sandbox_refund(p_wallet_id uuid, p_ref_id text, p_amount bigint)
returns table(balance bigint, refunded boolean)
language plpgsql
security definer
set search_path = api, public
as $$
declare
  v_before bigint;
  v_after bigint;
  v_key text := 'sandbox:credit:' || p_ref_id;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  insert into api.dlavie_h2h_sandbox_wallets(wallet_id)
  values (p_wallet_id)
  on conflict (wallet_id) do nothing;

  if exists(select 1 from api.dlavie_h2h_sandbox_ledger where idempotency_key=v_key) then
    select w.balance into v_after from api.dlavie_h2h_sandbox_wallets w where w.wallet_id=p_wallet_id;
    return query select v_after, false;
    return;
  end if;

  if not exists(select 1 from api.dlavie_h2h_sandbox_ledger where idempotency_key='sandbox:debit:' || p_ref_id) then
    raise exception 'sandbox_debit_not_found';
  end if;

  select w.balance into v_before
  from api.dlavie_h2h_sandbox_wallets w
  where w.wallet_id=p_wallet_id
  for update;
  v_after := v_before + p_amount;
  update api.dlavie_h2h_sandbox_wallets
    set balance=v_after, updated_at=now()
    where wallet_id=p_wallet_id;
  insert into api.dlavie_h2h_sandbox_ledger(wallet_id,ref_id,direction,amount,balance_before,balance_after,idempotency_key,metadata)
    values(p_wallet_id,p_ref_id,'credit',p_amount,v_before,v_after,v_key,jsonb_build_object('mode','sandbox','reason','simulated_refund'));
  return query select v_after, true;
end;
$$;

revoke all on function api.dlavie_h2h_sandbox_balance(uuid) from public, anon, authenticated;
revoke all on function api.dlavie_h2h_sandbox_reserve(uuid,text,bigint) from public, anon, authenticated;
revoke all on function api.dlavie_h2h_sandbox_refund(uuid,text,bigint) from public, anon, authenticated;
grant execute on function api.dlavie_h2h_sandbox_balance(uuid) to service_role;
grant execute on function api.dlavie_h2h_sandbox_reserve(uuid,text,bigint) to service_role;
grant execute on function api.dlavie_h2h_sandbox_refund(uuid,text,bigint) to service_role;
