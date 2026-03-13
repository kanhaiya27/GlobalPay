import express from 'express';
import { supabase } from '../utils/supabase.js';
import { WalletDepositSchema } from '../utils/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /wallet/:currency
router.get('/:currency', authenticateToken, async (req, res) => {
  try {
    const { currency } = req.params;

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'INR', 'GBP'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        error: 'Invalid currency',
        code: 'INVALID_CURRENCY'
      });
    }

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('currency', currency)
      .single();

    if (error || !wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    res.status(200).json(wallet);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /wallet - Get all wallets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('currency, balance')
      .eq('user_id', req.user.id)
      .order('currency', { ascending: true });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch wallets',
        code: 'INTERNAL_ERROR'
      });
    }

    res.status(200).json({ wallets });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /wallet/deposit
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { currency, amount } = WalletDepositSchema.parse(req.body);

    // Get current wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('currency', currency)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    // Update balance
    const newBalance = parseFloat(wallet.balance) + amount;
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        last_updated: new Date().toISOString()
      })
      .eq('id', wallet.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Deposit failed',
        code: 'DEPOSIT_FAILED'
      });
    }

    res.status(201).json({
      id: updatedWallet.id,
      currency: updatedWallet.currency,
      balance: updatedWallet.balance,
      message: 'Deposit successful'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    res.status(500).json({
      error: 'Server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
