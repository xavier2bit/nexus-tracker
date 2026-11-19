// Webhook Receptor Oficial para GGCheckout — NexusTrack
const db = require('../../lib/db');

function parseAmount(raw) {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') {
    return raw > 100 && Number.isInteger(raw) ? raw / 100 : raw;
  }
  const str = String(raw).trim();
  if (/^\d+$/.test(str) && Number(str) >= 500) {
    return Number(str) / 100;
  }
  const parsed = parseFloat(str.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const event = payload.event || payload.type || payload.status || 'unknown';

    // Determina o status
    let status = 'pending';
    if (
      event === 'pix.paid' ||
      event === 'card.paid' ||
      event === 'paid' ||
      payload.status === 'paid'
    ) {
      status = 'paid';
    } else if (event === 'refunded' || payload.status === 'refunded') {
      status = 'refunded';
    }

    const customer = payload.customer || payload.buyer || {};
    const tracking = payload.tracking || payload.utm || {};
    const offerId = req.query.offer || payload.offer_id || tracking.offer || 'herois-da-multiplicacao';

    const orderId = String(
      payload.order_id || payload.payment_id || payload.transaction_id || payload.id || 'wh_' + Date.now()
    ).trim();

    const rawAmount =
      payload.amount ??
      payload.total ??
      payload.price ??
      payload.value ??
      payload.payment?.amount ??
      27.0;

    const sale = db.recordSale({
      id: orderId,
      offerId: offerId,
      amount: parseAmount(rawAmount),
      status: status,
      paymentMethod: payload.payment_method || (event.includes('pix') ? 'PIX' : 'Cartão'),
      customerName: customer.name || payload.name || 'Cliente Heroico',
      customerEmail: customer.email || payload.email || '',
      utmSource: tracking.utm_source || payload.utm_source || 'meta',
      utmMedium: tracking.utm_medium || payload.utm_medium || 'cpc',
      utmCampaign: tracking.utm_campaign || payload.utm_campaign || '',
      utmContent: tracking.utm_content || payload.utm_content || '01_dor_dos_pais',
      utmTerm: tracking.utm_term || payload.utm_term || '',
      timestamp: new Date().toISOString()
    });

    console.log(`[NexusTrack Webhook] Venda registrada com sucesso: ${sale.id} | Oferta: ${offerId} | R$${sale.amount} (${status})`);

    return res.status(200).json({
      success: true,
      message: 'Venda processada com sucesso no NexusTrack',
      saleId: sale.id
    });
  } catch (error) {
    console.error('[NexusTrack Webhook Error]:', error);
    return res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
};
