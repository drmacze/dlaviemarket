create table if not exists api.dlavie_iak_settings (
  id smallint primary key default 1 check (id=1),
  environment text not null default 'testing' check (environment in ('testing','production')),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into api.dlavie_iak_settings(id) values(1) on conflict (id) do nothing;
alter table api.dlavie_iak_settings enable row level security;
