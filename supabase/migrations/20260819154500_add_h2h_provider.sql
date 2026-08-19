create table if not exists api.dlavie_h2h_settings (
  id smallint primary key default 1 check (id=1),
  markup_mode text not null default 'fixed' check (markup_mode in ('fixed','percent')),
  markup_value numeric not null default 500,
  minimum_markup bigint not null default 300,
  live_enabled boolean not null default false,
  prepaid_enabled boolean not null default true,
  postpaid_enabled boolean not null default false,
  catalog_count integer not null default 0,
  last_catalog_sync_at timestamptz,
  last_catalog_sync_status text,
  last_catalog_sync_message text,
  last_hcoin_balance bigint,
  last_verification jsonb,
  webhook_configured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into api.dlavie_h2h_settings(id) values(1) on conflict(id) do nothing;

create or replace function api.dlavie_digital_catalog_summary_source(p_source text)
returns table(category text, product_kind text, product_count bigint, min_price bigint, max_price bigint, brands text[])
language sql
security definer
set search_path=api,public
as $$
  select p.category,
         p.product_kind,
         count(*)::bigint,
         coalesce(min(p.sell_price),0)::bigint,
         coalesce(max(p.sell_price),0)::bigint,
         coalesce(array_agg(distinct p.brand order by p.brand) filter (where p.brand is not null and p.brand<>''), '{}')
  from api.dlavie_digital_products p
  where p.source=p_source
    and p.buyer_product_status=true
    and p.seller_product_status=true
  group by p.category,p.product_kind
  order by p.product_kind,p.category;
$$;

create or replace function api.dlavie_touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at=now();
  return new;
end
$$;

drop trigger if exists dlavie_h2h_settings_touch on api.dlavie_h2h_settings;
create trigger dlavie_h2h_settings_touch
before update on api.dlavie_h2h_settings
for each row execute function api.dlavie_touch_updated_at();

comment on table api.dlavie_h2h_settings is 'Active H2H.id provider settings for DLavie Digital Market';
