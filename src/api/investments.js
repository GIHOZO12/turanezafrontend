import { apiRequest } from './client';
import { toQueryString } from './utils';

const INVESTMENTS_ROOT = '/api/v1/investments';
const PAYMENTS_ROOT = '/api/v1/payments';

export const fetchInvestments = (params = {}) =>
  apiRequest(`${INVESTMENTS_ROOT}/investments/${toQueryString(params)}`, {
    method: 'GET',
  });

export const fetchInvestmentById = (investmentId) =>
  apiRequest(`${INVESTMENTS_ROOT}/investments/${investmentId}/`, {
    method: 'GET',
  });

export const fetchInvestmentInstallments = async (investmentId) => {
  const data = await apiRequest(`${INVESTMENTS_ROOT}/installments/${toQueryString({ investment: investmentId })}`, {
    method: 'GET',
  });
  if (!investmentId) {
    return data || [];
  }
  const records = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  return records.filter((item) => `${item.investment}` === `${investmentId}`);
};

export const fetchInvestmentReturns = async (investmentId) => {
  const data = await apiRequest(`${INVESTMENTS_ROOT}/returns/${toQueryString({ investment: investmentId })}`, {
    method: 'GET',
  });
  if (!investmentId) {
    return data || [];
  }
  const records = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  return records.filter((item) => `${item.investment}` === `${investmentId}`);
};

export const fetchInvestmentPortfolio = () =>
  apiRequest(`${INVESTMENTS_ROOT}/investments/portfolio/`, {
    method: 'GET',
  });

export const fetchInvestmentPayments = async (investmentId) => {
  const data = await apiRequest(`${PAYMENTS_ROOT}/payments/${toQueryString({ investment: investmentId })}`, {
    method: 'GET',
  });
  if (!investmentId) {
    return data || [];
  }
  const records = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  return records.filter((item) => `${item.investment}` === `${investmentId}`);
};

export const fetchInvestmentSnapshot = (investmentId) =>
  apiRequest(`${INVESTMENTS_ROOT}/investments/${investmentId}/snapshot/`, {
    method: 'GET',
  });
