import { apiRequest } from './client';

export const createDepositCheckout = async ({ provider = 'stripe', successUrl, cancelUrl } = {}) => {
  return apiRequest('/api/v1/payments/deposit/', {
    method: 'POST',
    body: JSON.stringify({
      provider,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });
};

