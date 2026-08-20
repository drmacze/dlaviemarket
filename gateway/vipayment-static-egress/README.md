# DLavie VIPayment Static Egress Gateway

Gateway ini meneruskan request server-side DLavie ke VIPayment menggunakan satu static egress IP.

## Fly.io

1. Salin `fly.toml.example` menjadi `fly.toml` dan ubah nama app bila perlu.
2. Deploy app dari folder ini.
3. Set secret yang sama dengan field `Gateway secret` pada DLavie Admin:
   `fly secrets set DLAVIE_GATEWAY_SECRET="..."`
4. Allocate static egress IP di region yang sama:
   `fly ips allocate-egress --app <nama-app> -r sin`
5. Cek IP:
   `fly ips list --app <nama-app>`
6. Masukkan URL HTTPS app ke DLavie Admin, contoh `https://<nama-app>.fly.dev`, lalu tekan `Test gateway & baca IP`.
7. Salin IPv4 yang tampil ke Whitelist IP VIPayment.

Gateway hanya mengizinkan path VIPayment `/api/profile` dan `/api/prepaid`; API credential tetap berada di Supabase Vault.