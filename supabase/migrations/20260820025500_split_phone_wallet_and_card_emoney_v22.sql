create or replace function api.dlavie_split_ewallet_storefront_v22()
returns trigger
language plpgsql
set search_path=api,public
as $$
begin
  if new.source='h2h' and new.product_type='e_wallet' then
    if new.brand in ('e-Money Mandiri','Flazz BCA','BRIzzi','TapCash BNI') then
      new.category:='Kartu E-Money';
    elsif lower(coalesce(new.brand,'')) like '%transfer va%' then
      new.category:='Transfer & VA';
    else
      new.category:='E-Wallet';
    end if;
  end if;
  return new;
end;$$;

drop trigger if exists zz_dlavie_split_ewallet_storefront_v22 on api.dlavie_digital_products;
create trigger zz_dlavie_split_ewallet_storefront_v22
before insert or update on api.dlavie_digital_products
for each row execute function api.dlavie_split_ewallet_storefront_v22();

update api.dlavie_digital_products set updated_at=now() where source='h2h' and product_type='e_wallet';
