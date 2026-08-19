create or replace function api.dlavie_digital_catalog_summary_source(p_source text)
returns table(
  category text,
  product_kind text,
  product_count bigint,
  min_price bigint,
  max_price bigint,
  brands text[]
)
language sql
security definer
set search_path=api,public
as $$
  select p.category,
         p.product_kind,
         count(*)::bigint as product_count,
         coalesce(min(p.sell_price),0)::bigint as min_price,
         coalesce(max(p.sell_price),0)::bigint as max_price,
         array_agg(distinct p.brand order by p.brand) filter (where p.brand is not null and p.brand<>'') as brands
  from api.dlavie_digital_products p
  where p.source=p_source
    and p.buyer_product_status=true
    and p.seller_product_status=true
  group by p.category,p.product_kind
  order by p.product_kind,p.category;
$$;
