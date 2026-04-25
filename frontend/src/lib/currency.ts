export const DEFAULT_CURRENCY = import.meta.env.VITE_DEFAULT_CURRENCY || 'USD';
export const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || 'en-US';

export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {}
): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '';

  const finalCurrency = currency || DEFAULT_CURRENCY;

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: finalCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}
