// Flat rate-per-state table (in kobo) until a live courier quote API is integrated.
// Extend/override without a redeploy via SHIPPING_RATES_KOBO_JSON, e.g.
//   SHIPPING_RATES_KOBO_JSON={"Lagos":150000,"Abuja":300000}
const DEFAULT_RATES_KOBO = {
  lagos: 200000,
  ogun: 250000,
  oyo: 280000,
  abuja: 350000,
  fct: 350000,
  rivers: 350000,
  kano: 400000,
};

const DEFAULT_FEE_KOBO = Number(process.env.SHIPPING_FEE_KOBO) || 300000;

function loadRateOverrides() {
  if (!process.env.SHIPPING_RATES_KOBO_JSON) return {};
  try {
    const parsed = JSON.parse(process.env.SHIPPING_RATES_KOBO_JSON);
    return Object.fromEntries(Object.entries(parsed).map(([state, fee]) => [state.toLowerCase(), Number(fee)]));
  } catch {
    return {};
  }
}

const RATES_KOBO = { ...DEFAULT_RATES_KOBO, ...loadRateOverrides() };

function getShippingFee(state) {
  const key = (state || "").trim().toLowerCase();
  return RATES_KOBO[key] ?? DEFAULT_FEE_KOBO;
}

module.exports = { getShippingFee };
