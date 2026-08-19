alter table api.dlavie_digital_orders
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_policy_version text;
