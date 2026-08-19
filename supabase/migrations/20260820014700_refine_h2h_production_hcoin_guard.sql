create or replace function api.dlavie_guard_h2h_production()
returns trigger
language plpgsql
security definer
set search_path = api, public
as $$
begin
  if new.live_enabled is true
     and (tg_op = 'INSERT' or old.live_enabled is distinct from true)
     and coalesce(new.last_hcoin_balance,0) <= 0 then
    raise exception 'hcoin_required';
  end if;
  return new;
end;
$$;
