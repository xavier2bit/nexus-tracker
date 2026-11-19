// Storage Layer Pluggável para o NexusTrack (Suporta Memória, /tmp, e Postgres/Supabase)
const fs = require('fs');
const path = require('path');

const STORE_PATH = process.env.NEXUS_STORE_PATH || path.join(process.platform === 'win32' ? process.cwd() : '/tmp', 'nexus_tracker_db.json');

// Estado em memória inicial
let memoryStore = {
  offers: [
    { id: 'herois-da-multiplicacao', name: 'Heróis da Multiplicação', domain: 'heroisdamultiplicacao.vercel.app', createdAt: new Date().toISOString() }
  ],
  sales: [],
  clicks: []
};

// Carrega store persistente se existir
function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf8');
      memoryStore = JSON.parse(content);
    }
  } catch (e) {
    // Fallback silencioso para memória
  }
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (e) {
    // Em ambientes serverless read-only estritos
  }
}

loadStore();

module.exports = {
  getOffers() {
    loadStore();
    return memoryStore.offers || [];
  },

  registerOffer(id, name, domain) {
    loadStore();
    const existing = memoryStore.offers.find(o => o.id === id);
    if (!existing) {
      memoryStore.offers.push({
        id,
        name: name || id,
        domain: domain || '',
        createdAt: new Date().toISOString()
      });
      saveStore();
    }
    return memoryStore.offers;
  },

  recordSale(saleData) {
    loadStore();
    const sale = {
      id: saleData.id || 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      offerId: saleData.offerId || 'herois-da-multiplicacao',
      amount: Number(saleData.amount || 0),
      status: saleData.status || 'paid', // paid, pending, refunded
      paymentMethod: saleData.paymentMethod || 'PIX',
      customerName: saleData.customerName || 'Cliente',
      customerEmail: saleData.customerEmail || '',
      utmSource: saleData.utmSource || 'direto',
      utmMedium: saleData.utmMedium || '',
      utmCampaign: saleData.utmCampaign || '',
      utmContent: saleData.utmContent || 'geral',
      utmTerm: saleData.utmTerm || '',
      timestamp: saleData.timestamp || new Date().toISOString()
    };

    // Previne duplicação pelo ID da transação
    const idx = memoryStore.sales.findIndex(s => s.id === sale.id);
    if (idx !== -1) {
      memoryStore.sales[idx] = sale;
    } else {
      memoryStore.sales.unshift(sale);
    }

    saveStore();
    return sale;
  },

  recordClick(clickData) {
    loadStore();
    const click = {
      offerId: clickData.offer || 'herois-da-multiplicacao',
      utms: clickData.utms || {},
      timestamp: clickData.timestamp || new Date().toISOString()
    };
    memoryStore.clicks.push(click);
    // Limita histórico de cliques na memória
    if (memoryStore.clicks.length > 5000) {
      memoryStore.clicks = memoryStore.clicks.slice(-5000);
    }
    saveStore();
    return click;
  },

  getStats(offerFilter = 'all') {
    loadStore();
    let sales = memoryStore.sales || [];
    let clicks = memoryStore.clicks || [];

    if (offerFilter !== 'all') {
      sales = sales.filter(s => s.offerId === offerFilter);
      clicks = clicks.filter(c => c.offerId === offerFilter);
    }

    const paidSales = sales.filter(s => s.status === 'paid');
    const pendingSales = sales.filter(s => s.status === 'pending');

    const totalRevenue = paidSales.reduce((acc, s) => acc + s.amount, 0);
    const totalSalesCount = paidSales.length;
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    const pixPaid = paidSales.filter(s => s.paymentMethod.toUpperCase().includes('PIX')).length;
    const pixPending = pendingSales.filter(s => s.paymentMethod.toUpperCase().includes('PIX')).length;
    const pixTotal = pixPaid + pixPending;
    const pixConversion = pixTotal > 0 ? ((pixPaid / pixTotal) * 100).toFixed(1) + '%' : '0.0%';

    // Agrupamento por UTM Content (Criativos)
    const attributionMap = {};

    paidSales.forEach(s => {
      const tag = s.utmContent || 'direto';
      if (!attributionMap[tag]) {
        attributionMap[tag] = {
          tag,
          vendas: 0,
          receita: 0,
          cliques: 0
        };
      }
      attributionMap[tag].vendas += 1;
      attributionMap[tag].receita += s.amount;
    });

    clicks.forEach(c => {
      const tag = (c.utms && c.utms.utm_content) || 'direto';
      if (!attributionMap[tag]) {
        attributionMap[tag] = {
          tag,
          vendas: 0,
          receita: 0,
          cliques: 0
        };
      }
      attributionMap[tag].cliques += 1;
    });

    const attributionList = Object.values(attributionMap).map(item => ({
      ...item,
      conversao: item.cliques > 0 ? ((item.vendas / item.cliques) * 100).toFixed(1) + '%' : '0.0%'
    }));

    return {
      offers: memoryStore.offers,
      summary: {
        totalRevenue,
        totalSales: totalSalesCount,
        averageTicket,
        pendingCount: pendingSales.length,
        pixConversion,
        totalClicks: clicks.length
      },
      recentSales: sales.slice(0, 50),
      attribution: attributionList
    };
  }
};
