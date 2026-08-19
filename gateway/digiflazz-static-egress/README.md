# DLavie Digiflazz Static Egress Gateway

Gateway kecil ini menjadi satu-satunya jalur outbound DLavie ke API Buyer Digiflazz. Website tetap di GitHub Pages dan credential tetap disimpan oleh backend DLavie/Supabase; gateway hanya menerima request backend yang sudah ditandatangani HMAC lalu meneruskannya dari host dengan public IP statis.

## Kenapa gateway diperlukan

Digiflazz Buyer API memakai whitelist IP pada Pengaturan Koneksi API. Karena itu host gateway harus mempunyai public egress IPv4 yang tetap dan IP tersebut harus dimasukkan ke whitelist Digiflazz.

## Environment

Hanya satu secret yang wajib disimpan di host gateway:

```text
DLAVIE_GATEWAY_SECRET=<nilai dari Digiflazz Control Center DLavie>
PORT=8080
```

Username dan API Key Digiflazz **tidak** perlu disimpan sebagai environment variable gateway. Backend DLavie mengirimkannya hanya pada request server-to-server yang sudah dilindungi HTTPS + HMAC.

## Endpoint

- `GET /health` — health check.
- `POST /` — endpoint private yang dipanggil Supabase Edge Function.

Request `POST` harus memiliki:

```text
x-dlavie-timestamp: <unix seconds>
x-dlavie-signature: HMAC-SHA256(DLAVIE_GATEWAY_SECRET, timestamp + "\n" + raw_body)
```

Gateway menolak timestamp yang melenceng lebih dari 90 detik.

## Operation yang didukung

### `ping`
Dipakai tombol **Test gateway** pada admin DLavie.

### `price_list`
Meneruskan ke `/v1/price-list` dan membuat signature Digiflazz `md5(username + apiKey + "pricelist")`. Mendukung `cmd=prepaid` dan `cmd=pasca`.

### `transaction`
Meneruskan transaksi prepaid/pascabayar ke `/v1/transaction` dengan signature `md5(username + apiKey + ref_id)`. Parameter yang diteruskan bila ada: `commands`, `testing`, `max_price`, `amount`, dan `year`.

`amount` dan `year` disiapkan untuk flow khusus seperti E-Money/PBB. SAMSAT tetap menggunakan `customer_no` gabungan sesuai format supplier.

## Deployment

Container dapat dibangun langsung dari folder ini:

```bash
docker build -t dlavie-digiflazz-gateway .
docker run --rm -p 8080:8080 \
  -e DLAVIE_GATEWAY_SECRET='...' \
  dlavie-digiflazz-gateway
```

Untuk production, deploy container ini ke host yang menyediakan **static outbound IPv4**. Setelah mendapat IP:

1. Whitelist IP tersebut di Pengaturan Koneksi API Digiflazz.
2. Buka DLavie Admin → Digiflazz Control Center.
3. Generate `Gateway secret`, pasang nilainya pada host sebagai `DLAVIE_GATEWAY_SECRET`.
4. Simpan URL HTTPS gateway pada Control Center.
5. Tekan **Test gateway**.
6. Simpan Username + API Key Digiflazz melalui Control Center.
7. Tekan **Sync katalog sekarang**.
8. Pastikan SKU sudah muncul sebelum mengaktifkan transaksi.

## Security notes

- Jangan expose `DLAVIE_GATEWAY_SECRET` di frontend.
- Jangan log body request karena body mengandung credential Buyer API.
- Gunakan HTTPS pada public endpoint.
- Restrict inbound network ke backend DLavie bila provider hosting mendukung allowlist/firewall.
- Rotate gateway secret jika pernah bocor.
