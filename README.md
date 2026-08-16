# Dlaviemarket

Frontend marketplace nomor virtual yang dioptimalkan untuk GitHub Pages.

## URL GitHub Pages

Setelah Pages diaktifkan dengan **Settings → Pages → Source: GitHub Actions**, website akan dipublish di:

`https://drmacze.github.io/dlaviemarket/`

Setiap push ke branch `main` akan menjalankan workflow `.github/workflows/pages.yml`.

## Status

Versi saat ini adalah frontend demo. Saldo, login, deposit, dan order disimpan/disimulasikan di browser. Untuk production, payment gateway, database, autentikasi, supplier API, callback pembayaran, OTP, dan refund harus dijalankan melalui backend aman agar credential/secret tidak terekspos ke browser.

Minimum deposit pada UI sudah diset **Rp1.000**.
