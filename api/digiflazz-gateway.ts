import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})

function safeEqualHex(a: string, b: string) {
  try {
    const aa = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    return aa.length === bb.length && aa.length > 0 && timingSafeEqual(aa, bb)
  } catch { return false }
}

function md5(value: string) {
  return createHash('md5').update(value).digest('hex')
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') return json({ ok: false, forwarded: false, error: 'method_not_allowed' }, 405)

    const shared = process.env.DLAVIE_GATEWAY_SECRET || ''
    if (!shared) return json({ ok: false, forwarded: false, error: 'gateway_secret_not_configured' }, 503)

    const raw = await request.text()
    if (raw.length > 16_000) return json({ ok: false, forwarded: false, error: 'payload_too_large' }, 413)

    const timestamp = request.headers.get('x-dlavie-timestamp') || ''
    const signature = (request.headers.get('x-dlavie-signature') || '').toLowerCase()
    const unix = Number(timestamp)
    if (!Number.isFinite(unix) || Math.abs(Date.now() / 1000 - unix) > 90) {
      return json({ ok: false, forwarded: false, error: 'stale_request' }, 401)
    }

    const expected = createHmac('sha256', shared).update(`${timestamp}\n${raw}`).digest('hex')
    if (!safeEqualHex(signature, expected)) return json({ ok: false, forwarded: false, error: 'bad_signature' }, 403)

    let body: Record<string, any>
    try { body = JSON.parse(raw) } catch { return json({ ok: false, forwarded: false, error: 'invalid_json' }, 400) }

    const op = String(body.op || '')
    if (op === 'ping') return json({ ok: true, forwarded: false, region: process.env.VERCEL_REGION || 'unknown' })

    const username = String(body.username || '').trim()
    const apiKey = String(body.api_key || '').trim()
    if (!username || !apiKey) return json({ ok: false, forwarded: false, error: 'digiflazz_credentials_missing' }, 400)

    let endpoint = ''
    let payload: Record<string, any> = {}

    if (op === 'price_list') {
      const cmd = body.cmd === 'pasca' ? 'pasca' : 'prepaid'
      endpoint = 'https://api.digiflazz.com/v1/price-list'
      payload = { cmd, username, sign: md5(`${username}${apiKey}pricelist`) }
    } else if (op === 'transaction') {
      const refId = String(body.ref_id || '').trim()
      const sku = String(body.buyer_sku_code || '').trim()
      const customerNo = String(body.customer_no || '').trim()
      if (!refId || !sku || !customerNo) return json({ ok: false, forwarded: false, error: 'transaction_fields_missing' }, 400)
      endpoint = 'https://api.digiflazz.com/v1/transaction'
      payload = {
        username,
        buyer_sku_code: sku,
        customer_no: customerNo,
        ref_id: refId,
        sign: md5(`${username}${apiKey}${refId}`),
        testing: Boolean(body.testing),
      }
      const maxPrice = Number(body.max_price)
      if (Number.isFinite(maxPrice) && maxPrice > 0) payload.max_price = Math.round(maxPrice)
    } else {
      return json({ ok: false, forwarded: false, error: 'invalid_operation' }, 400)
    }

    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const text = await upstream.text()
      let response: any
      try { response = JSON.parse(text) } catch { response = { message: text.slice(0, 1000) } }
      return json({
        ok: upstream.ok,
        forwarded: true,
        upstream_status: upstream.status,
        data: response?.data ?? null,
        response,
      }, upstream.ok ? 200 : 502)
    } catch {
      // Once fetch() starts, delivery to the supplier is ambiguous. The orchestrator
      // must keep the order pending instead of issuing an automatic refund.
      return json({ ok: false, forwarded: true, error: 'upstream_delivery_unknown' }, 502)
    }
  },
}
