export const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'USD';

// Helper to ensure Stripe always receives a lowercase ISO currency code
export const getStripeCurrency = (currency) => {
  const code = (currency || DEFAULT_CURRENCY || 'USD').toString();
  return code.toLowerCase();
};

export default {
  DEFAULT_CURRENCY,
  getStripeCurrency,
};
