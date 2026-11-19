// Stats API Endpoint — NexusTrack
const db = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permite cadastrar nova oferta via POST /api/v1/stats
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (body.action === 'create_offer') {
        const offers = db.registerOffer(body.id, body.name, body.domain);
        return res.status(200).json({ success: true, offers });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Erro ao processar criação de oferta' });
    }
  }

  const offerFilter = req.query.offer || 'all';
  const data = db.getStats(offerFilter);

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    offerFilter,
    ...data
  });
};
