import express from 'express';
import { getExchangeRate } from '../utils/exchangeRate.js';
import { ExchangeRateSchema } from '../utils/validation.js';

const router = express.Router();

// GET /exchange-rates?from=USD&to=INR
router.get('/', async (req, res) => {
  try {
    const { from, to } = ExchangeRateSchema.parse(req.query);

    const rateData = await getExchangeRate(from, to);
    res.status(200).json(rateData);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    res.status(500).json({
      error: error.message || 'Failed to fetch exchange rate',
      code: 'EXCHANGE_RATE_ERROR'
    });
  }
});

export default router;
