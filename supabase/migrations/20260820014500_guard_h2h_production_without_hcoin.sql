create or replace function api.dlavie_guard_h2h_production()
returns trigger
language plpgsql
security definer
set search_path = api, public
as $$
begin
  if new.live_enabled is true and coalesce(new.last_hcoin_balance,0) <= 0 then
    raise exception 'hcoin_required';
  end if;
  return new;
end;
$$;

drop trigger if exists dlavie_h2h_production_hcoin_guard on api.dlavie_h2h_settings;
create trigger dlavie_h2h_production_hcoin_guard
before insert or update on api.dlavie_h2h_settings
for each row execute function api.dlavie_guard_h2h_production();

revoke all on function api.dlavie_guard_h2h_production() from public, anon, authenticated;
grant execute on function api.dlavie_guard_h2h_production() to service_role;
