import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute TTL

const EXCHANGE_RATE_API_URL = process.env.EXCHANGE_RATE_API_URL;
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;

if (!EXCHANGE_RATE_API_URL || !EXCHANGE_RATE_API_KEY) {
  console.warn('Exchange Rate API not configured. Rates will fail.');
}

export const getExchangeRate = async (from, to) => {
  if (from === to) {
    return { from, to, rate: 1.0, timestamp: new Date().toISOString(), cached: true };
  }

  const cacheKey = `exchange_${from}_${to}`;
  const cachedRate = cache.get(cacheKey);

  if (cachedRate) {
    return { ...cachedRate, cached: true };
  }

  try {
    const response = await axios.get(
      `${EXCHANGE_RATE_API_URL}/${from}`,
      {
        params: { apikey: EXCHANGE_RATE_API_KEY }
      }
    );

    const rate = response.data.rates[to];
    if (!rate) {
      throw new Error('Rate not found');
    }

    const rateData = {
      from,
      to,
      rate,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, rateData);
    return { ...rateData, cached: false };
  } catch (error) {
    console.error('Exchange rate fetch failed:', error.message);
    throw new Error('Failed to fetch exchange rate');
  }
};

export const clearExchangeRateCache = () => {
  cache.flushAll();
};
