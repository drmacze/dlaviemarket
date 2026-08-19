-- H2H Control Center is accessed only through authenticated Edge Functions.
-- service_role needs PostgREST table privileges even though it bypasses RLS.
grant usage on schema api to service_role;
grant select, insert, update, delete on table api.dlavie_h2h_settings to service_role;
