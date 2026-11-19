# ⚡ NexusTrack — Rastreador & Atribuição Multi-Ofertas (Estilo UTMify)

O **NexusTrack** é um sistema independente de rastreamento de tráfego, captura de UTMs e atribuição de vendas multi-ofertas, projetado para operar sem custos mensais e sem depender de ferramentas de terceiros.

---

## 🚀 Como Funciona o Ecossistema

1. **Universal Tracker (`public/tracker.js`)**: Você adiciona uma linha de script no `<head>` de qualquer Landing Page. Ele captura as UTMs do anúncio e as injeta automaticamente nos links de checkout (GGCheckout, Kiwify, Hotmart, etc.).
2. **Webhook Ingestion Engine (`/api/v1/webhooks/ggcheckout`)**: O checkout avisa suas vendas em tempo real via Webhook com dados do cliente e as tags UTM.
3. **Painel Central (`public/index.html`)**: Dashboard visual moderno (Dark mode) com seletor de ofertas, métricas em tempo real (Faturamento, Conversão de PIX, Ticket Médio), tabela de criativos e feed ao vivo com som de venda.

---

## 🛠️ Passo a Passo de Instalação e Uso

### 1. Como Rodar Localmente (Teste)
```bash
node server.js
```
Abra no navegador: `http://localhost:3030`

### 2. Como Fazer Deploy na Vercel (100% Gratuito)
1. Suba esta pasta para um novo repositório no seu GitHub (ex: `nexus-track`).
2. Acesse seu painel na **Vercel** > **Add New Project** > selecione o repositório `nexus-track`.
3. Clique em **Deploy**! Você terá uma URL oficial (ex: `https://nexus-track.vercel.app`).

---

## 🔗 Como Integrar Suas Ofertas

### Passo 1: No Checkout (Ex: GGCheckout)
No painel do GGCheckout, vá em **Webhooks** e adicione a URL:
```text
https://SEU-DOMINIO-VERCEL.app/api/v1/webhooks/ggcheckout?offer=herois-da-multiplicacao
```
*(Para uma nova oferta no futuro, basta trocar o parâmetro `?offer=nome-da-nova-oferta`)*.

### Passo 2: Na Landing Page da Oferta
No `<head>` da página de vendas, adicione:
```html
<script src="https://SEU-DOMINIO-VERCEL.app/tracker.js" data-offer="herois-da-multiplicacao"></script>
```

Pronto! Todas as pessoas que clicarem nos seus anúncios do Meta Ads terão seus criativos e UTMs rastreados e, assim que comprarem, a venda tocará o sino e aparecerá no painel em tempo real!
