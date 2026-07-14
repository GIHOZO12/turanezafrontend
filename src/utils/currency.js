export const DEFAULT_CURRENCY = 'RWF';

export const formatCurrency = (value, currency = DEFAULT_CURRENCY, options = {}) => {
  const numeric = Number(value || 0);
  const maximumFractionDigits = options.maximumFractionDigits ?? (numeric >= 100000 ? 0 : 2);
  const symbol = currency === 'USD' ? '$' : currency;

  if (!Number.isFinite(numeric)) {
    return `${symbol} 0`;
  }

  try {
    const formatted = new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency,
      maximumFractionDigits,
    }).format(numeric);
    return currency === 'USD' ? formatted.replace(/US\$/g, '$') : formatted;
  } catch (error) {
    return `${symbol} ${numeric.toLocaleString()}`;
  }
};

export const formatFlexibleCurrency = (value, currency = DEFAULT_CURRENCY) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Flexible';
  }
  return formatCurrency(numeric, currency, { maximumFractionDigits: 0 });
};
