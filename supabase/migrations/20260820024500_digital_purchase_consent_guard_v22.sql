alter table api.dlavie_digital_orders
  add column if not exists user_data_confirmed boolean not null default false,
  add column if not exists policy_accepted boolean not null default false,
  add column if not exists policy_version text,
  add column if not exists purchase_confirmed_at timestamptz;

create table if not exists api.dlavie_digital_purchase_consents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  sku text not null,
  customer_no text not null,
  policy_version text not null,
  confirmed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '5 minutes'),
  consumed_at timestamptz
);

alter table api.dlavie_digital_purchase_consents enable row level security;
revoke all on api.dlavie_digital_purchase_consents from anon, authenticated;
grant select,insert,update,delete on api.dlavie_digital_purchase_consents to service_role;

create index if not exists dlavie_purchase_consents_match_idx on api.dlavie_digital_purchase_consents(user_id,sku,customer_no,expires_at) where consumed_at is null;

create or replace function api.dlavie_require_h2h_purchase_consent_v22()
returns trigger
language plpgsql
security definer
set search_path=api,public
as $$
declare c api.dlavie_digital_purchase_consents%rowtype;
begin
  if new.source='h2h' and old.source is distinct from 'h2h' then
    select * into c from api.dlavie_digital_purchase_consents
      where user_id=new.user_id and sku=new.sku and customer_no=new.customer_no
        and consumed_at is null and expires_at>now()
      order by confirmed_at desc limit 1 for update skip locked;
    if c.id is null then raise exception 'purchase_consent_required'; end if;
    new.user_data_confirmed:=true;
    new.policy_accepted:=true;
    new.policy_version:=c.policy_version;
    new.purchase_confirmed_at:=c.confirmed_at;
    update api.dlavie_digital_purchase_consents set consumed_at=now() where id=c.id;
  end if;
  return new;
end;$$;

drop trigger if exists dlavie_require_h2h_purchase_consent_v22 on api.dlavie_digital_orders;
create trigger dlavie_require_h2h_purchase_consent_v22
before update of source on api.dlavie_digital_orders
for each row execute function api.dlavie_require_h2h_purchase_consent_v22();

grant execute on function api.dlavie_require_h2h_purchase_consent_v22() to service_role;
