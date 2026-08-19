create or replace function api.dlavie_normalize_digital_product()
returns trigger
language plpgsql
as $$
declare
  v_all text;
  v_category text;
  v_brand text;
begin
  v_all := regexp_replace(lower(concat_ws(' ', coalesce(new.category,''), coalesce(new.brand,''), coalesce(new.product_name,''), coalesce(new.product_type,''), coalesce(new.sku,''))), '[^a-z0-9]+', '', 'g');
  v_category := regexp_replace(lower(coalesce(new.category,'')), '[^a-z0-9]+', '', 'g');
  v_brand := regexp_replace(lower(coalesce(new.brand,'')), '[^a-z0-9]+', '', 'g');

  if new.product_kind = 'postpaid' then
    if v_all like '%samsat%' then
      new.category := 'SAMSAT';
    elsif v_all like '%pbb%' or v_all like '%pajakbumibangunan%' then
      new.category := 'PBB';
    elsif v_all like '%bpjs%' then
      new.category := 'BPJS';
    elsif v_all like '%pdam%' or v_all like '%airminum%' then
      new.category := 'PDAM';
    elsif v_all like '%pln%' or v_all like '%listrik%' then
      new.category := 'PLN & Listrik';
    elsif v_all like '%emoney%' or v_all like '%etoll%' or v_all like '%brizzi%' or v_all like '%flazz%' or v_all like '%tapcash%' then
      new.category := 'E-Money';
    elsif v_all like '%internet%' or v_all like '%indihome%' or v_all like '%telkom%' or v_all like '%tvkabel%' or v_all like '%televisi%' then
      new.category := 'Internet & TV';
    elsif v_all like '%multifinance%' or v_all like '%finance%' or v_all like '%leasing%' then
      new.category := 'Multifinance';
    elsif v_all like '%gas%' or v_all like '%pgn%' then
      new.category := 'Gas';
    elsif v_all like '%pajak%' then
      new.category := 'Pajak';
    else
      new.category := 'Tagihan Lainnya';
    end if;
  else
    if v_category in ('pulsa','pulsaoperator','mobile') or v_all like '%pulsa%' then
      new.category := 'Pulsa';
    elsif v_category in ('data','paketdata','internet') or v_all like '%paketdata%' or v_all like '%kuota%' then
      new.category := 'Paket Data';
    elsif v_category in ('pln','listrik') or v_all like '%pln%' or v_all like '%tokenlistrik%' then
      new.category := 'PLN';
    elsif v_category in ('emoney','ewallet','dompetdigital') or v_all like '%ewallet%' or v_all like '%emoney%' or v_brand in ('dana','ovo','gopay','shopeepay','linkaja') then
      new.category := 'E-Wallet';
    elsif v_category in ('games','game','voucher','vouchergame') or v_all like '%games%' or v_all like '%voucher%' then
      new.category := 'Voucher & Game';
    elsif v_category in ('aktivasi','aktivasivoucher') then
      new.category := 'Aktivasi & Voucher';
    elsif trim(coalesce(new.category,'')) = '' then
      new.category := 'Produk Digital Lainnya';
    end if;
  end if;

  new.requires_extended_input := (
    new.product_kind = 'postpaid'
    and (
      v_all like '%samsat%'
      or v_all like '%pbb%'
      or v_all like '%pajakbumibangunan%'
      or v_all like '%emoney%'
      or v_all like '%etoll%'
      or v_all like '%brizzi%'
      or v_all like '%flazz%'
      or v_all like '%tapcash%'
    )
  );

  return new;
end;
$$;

drop trigger if exists dlavie_normalize_digital_product_before_write on api.dlavie_digital_products;
create trigger dlavie_normalize_digital_product_before_write
before insert or update on api.dlavie_digital_products
for each row execute function api.dlavie_normalize_digital_product();

update api.dlavie_digital_products
set updated_at = updated_at;
