create or replace function api.dlavie_normalize_h2h_storefront_v21()
returns trigger
language plpgsql
set search_path = api, public
as $$
declare
  p text := trim(coalesce(new.raw->>'produk',''));
  d text := trim(coalesce(new.raw->>'keterangan',''));
  xp text := lower(trim(coalesce(new.raw->>'produk','')));
  x text := lower(trim(concat_ws(' ',coalesce(new.raw->>'produk',''),coalesce(new.raw->>'kategori',''),coalesce(new.raw->>'keterangan',''))));
begin
  if new.source <> 'h2h' then return new; end if;

  if d <> '' then new.product_name := d;
  elsif p <> '' then new.product_name := p;
  else new.product_name := new.sku;
  end if;

  new.category := case new.product_type
    when 'pulsa' then 'Pulsa'
    when 'paket_data' then 'Paket Data'
    when 'paket_telp_sms' then 'Paket Data'
    when 'pln' then 'PLN'
    when 'e_wallet' then 'E-Wallet'
    when 'voucher_game' then 'Voucher & Game'
    when 'cetak_voucher' then 'Voucher Operator'
    when 'streaming' then 'Streaming & Hiburan'
    else new.category end;

  if new.product_type in ('pulsa','paket_data','paket_telp_sms','cetak_voucher') then
    new.brand := case
      when x ~ 'telkomsel|tsel|simpati|kartu as|by[.]?u' then 'Telkomsel'
      when x ~ 'indosat|im3|isat|mentari|freedom' then 'IM3'
      when x ~ '(^| )xl( |$)|xl axiata|xtra combo|xtra kuota' then 'XL'
      when x ~ 'axis|bronet' then 'AXIS'
      when x ~ '(^| )tri( |$)|three|happy' then 'Tri'
      when x ~ 'smartfren|(^| )smart (data|cetak|unlimited|volume|telepon)|data smart|voucher data jumbo|telepon paket smart' then 'Smartfren'
      when x ~ 'wifi[.]id' then 'WiFi.id'
      when p <> '' then p else coalesce(nullif(new.brand,''),'H2H.id') end;
  elsif new.product_type='e_wallet' then
    new.brand := case
      when x ~ '(^| )dana( |$)' then 'DANA'
      when x ~ '(^| )ovo( |$)' then 'OVO'
      when x ~ 'gopay|go pay' then 'GoPay'
      when x ~ 'shopeepay|shopee pay|saldo shopee' then 'ShopeePay'
      when x ~ 'linkaja|link aja' then 'LinkAja'
      when x ~ 'isaku' then 'iSaku'
      when x ~ 'astrapay' then 'AstraPay'
      when x ~ '(^| )doku( |$)' then 'DOKU'
      when x ~ 'e-money|e money.*mandiri|mandiri.*money' then 'e-Money Mandiri'
      when x ~ 'flazz' then 'Flazz BCA'
      when x ~ 'brizzi' then 'BRIzzi'
      when x ~ 'tapcash' then 'TapCash BNI'
      when x ~ 'indriver|indrive' then 'InDrive'
      when x ~ 'grab' then 'Grab'
      when x ~ 'maxim' then 'Maxim'
      when p <> '' then p else coalesce(nullif(new.brand,''),'H2H.id') end;
  elsif new.product_type='pln' then new.brand := 'PLN';
  elsif new.product_type='streaming' then
    new.brand := case
      when x ~ 'spotify' then 'Spotify'
      when x ~ 'vidio' then 'Vidio'
      when x ~ 'wetv' then 'WeTV'
      when x ~ 'genflix' then 'Genflix'
      when x ~ 'netflix' then 'Netflix'
      when p <> '' then regexp_replace(p,'^Berlangganan[ ]+','','i') else coalesce(nullif(new.brand,''),'Streaming') end;
  elsif new.product_type='voucher_game' then
    new.brand := case
      when xp ~ 'mobile legends' then 'Mobile Legends'
      when xp ~ 'free fire' then 'Free Fire'
      when xp ~ 'pubg' then 'PUBG Mobile'
      when xp ~ 'valorant' then 'Valorant'
      when xp ~ 'call of duty' then 'Call of Duty Mobile'
      when xp ~ 'honor of kings' then 'Honor of Kings'
      when xp ~ 'roblox' then 'Roblox'
      when xp ~ 'genshin' then 'Genshin Impact'
      when xp ~ 'zenless zone zero' then 'Zenless Zone Zero'
      when xp ~ 'honkai.*star rail' then 'Honkai: Star Rail'
      when xp ~ 'arena breakout' then 'Arena Breakout'
      when xp ~ 'delta force' then 'Delta Force'
      when xp ~ 'blood strike' then 'Blood Strike'
      when xp ~ 'league of legends wild rift' then 'Wild Rift'
      when xp ~ 'league of legends' then 'League of Legends'
      when xp ~ 'teamfight tactics' then 'Teamfight Tactics'
      when xp ~ 'arena of valor' then 'Arena of Valor'
      when xp ~ 'point blank' then 'Point Blank'
      when xp ~ 'fc mobile' then 'FC Mobile'
      when xp ~ 'magic chess' then 'Magic Chess: Go Go'
      when p <> '' then p else coalesce(nullif(new.brand,''),'Game') end;
  elsif p <> '' then new.brand := p;
  end if;

  if new.product_kind='prepaid' and (
      coalesce(new.base_price,0) <= 0
      or lower(d) ~ '(^|[^a-z])(test|cek)([^a-z]|$)'
      or lower(d) like '%bebas nominal%'
      or (new.product_type in ('paket_data','paket_telp_sms') and lower(d) ~ '^bayar ' and coalesce(new.base_price,0) < 2000)
    ) then
    new.buyer_product_status := false;
  end if;
  return new;
end;
$$;

drop trigger if exists dlavie_normalize_h2h_storefront_v21 on api.dlavie_digital_products;
create trigger dlavie_normalize_h2h_storefront_v21
before insert or update on api.dlavie_digital_products
for each row execute function api.dlavie_normalize_h2h_storefront_v21();

update api.dlavie_digital_products set updated_at=now() where source='h2h';
