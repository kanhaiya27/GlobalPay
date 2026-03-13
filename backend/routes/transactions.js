import express from 'express';
import { supabase } from '../utils/supabase.js';
import { getExchangeRate } from '../utils/exchangeRate.js';
import { TransactionCreateSchema, PaginationSchema } from '../utils/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /transactions/create
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, amount_send, from_currency, to_currency } = TransactionCreateSchema.parse(req.body);

    // Prevent self-transfer
    if (receiver_id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot transfer to yourself',
        code: 'INVALID_RECEIVER'
      });
    }

    // Get sender wallet
    const { data: senderWallet, error: senderError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('currency', from_currency)
      .single();

    if (senderError || !senderWallet) {
      return res.status(404).json({
        error: 'Sender wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    // Check if sender has sufficient balance
    if (parseFloat(senderWallet.balance) < amount_send) {
      return res.status(400).json({
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_FUNDS'
      });
    }

    // Get receiver wallet
    const { data: receiverWallet, error: receiverError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', receiver_id)
      .eq('currency', to_currency)
      .single();

    if (receiverError || !receiverWallet) {
      return res.status(404).json({
        error: 'Receiver wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    // Get exchange rate
    let exchangeRate = 1;
    if (from_currency !== to_currency) {
      try {
        const rateData = await getExchangeRate(from_currency, to_currency);
        exchangeRate = rateData.rate;
      } catch (error) {
        return res.status(500).json({
          error: 'Failed to get exchange rate',
          code: 'EXCHANGE_RATE_ERROR'
        });
      }
    }

    const amountReceived = amount_send * exchangeRate;

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        sender_id: req.user.id,
        receiver_id,
        amount_sent: amount_send,
        amount_received: amountReceived,
        from_currency,
        to_currency,
        exchange_rate_used: exchangeRate,
        status: 'pending'
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      return res.status(500).json({
        error: 'Failed to create transaction',
        code: 'TRANSACTION_CREATE_FAILED',
        details: transactionError.message
      });
    }

    // Update sender wallet (deduct)
    const { error: senderUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: parseFloat(senderWallet.balance) - amount_send,
        last_updated: new Date().toISOString()
      })
      .eq('id', senderWallet.id);

    if (senderUpdateError) {
      return res.status(500).json({
        error: 'Failed to update sender wallet',
        code: 'WALLET_UPDATE_FAILED'
      });
    }

    // Update receiver wallet (add)
    const { error: receiverUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: parseFloat(receiverWallet.balance) + amountReceived,
        last_updated: new Date().toISOString()
      })
      .eq('id', receiverWallet.id);

    if (receiverUpdateError) {
      return res.status(500).json({
        error: 'Failed to update receiver wallet',
        code: 'WALLET_UPDATE_FAILED'
      });
    }

    // Mark transaction as completed
    const { data: completedTransaction, error: completeError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (completeError) {
      return res.status(500).json({
        error: 'Failed to complete transaction',
        code: 'TRANSACTION_COMPLETION_FAILED'
      });
    }

    res.status(201).json({
      id: completedTransaction.id,
      sender_id: completedTransaction.sender_id,
      receiver_id: completedTransaction.receiver_id,
      amount_sent: completedTransaction.amount_sent,
      amount_received: completedTransaction.amount_received,
      from_currency: completedTransaction.from_currency,
      to_currency: completedTransaction.to_currency,
      exchange_rate_used: completedTransaction.exchange_rate_used,
      status: completedTransaction.status,
      created_at: completedTransaction.created_at,
      completed_at: completedTransaction.completed_at
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

// GET /transactions?limit=20&offset=0
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit, offset } = PaginationSchema.parse(req.query);

    const { data: transactions, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch transactions',
        code: 'INTERNAL_ERROR'
      });
    }

    res.status(200).json({
      transactions,
      total: count,
      limit,
      offset
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

// GET /transactions/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
    }

    // Check authorization
    if (transaction.sender_id !== req.user.id && transaction.receiver_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /transactions/:id/cancel
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
    }

    // Check authorization (only sender can cancel)
    if (transaction.sender_id !== req.user.id) {
      return res.status(403).json({
        error: 'Only sender can cancel transaction',
        code: 'FORBIDDEN'
      });
    }

    // Check if transaction is still pending
    if (transaction.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot cancel ${transaction.status} transaction`,
        code: 'INVALID_TRANSACTION_STATE'
      });
    }

    // Refund sender
    const { data: senderWallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.sender_id)
      .eq('currency', transaction.from_currency)
      .single();

    if (walletError || !senderWallet) {
      return res.status(500).json({
        error: 'Refund failed',
        code: 'REFUND_FAILED'
      });
    }

    await supabase
      .from('wallets')
      .update({
        balance: parseFloat(senderWallet.balance) + transaction.amount_sent,
        last_updated: new Date().toISOString()
      })
      .eq('id', senderWallet.id);

    // Refund receiver
    const { data: receiverWallet, error: receiverWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', transaction.receiver_id)
      .eq('currency', transaction.to_currency)
      .single();

    if (receiverWalletError || !receiverWallet) {
      return res.status(500).json({
        error: 'Refund failed',
        code: 'REFUND_FAILED'
      });
    }

    await supabase
      .from('wallets')
      .update({
        balance: parseFloat(receiverWallet.balance) - transaction.amount_received,
        last_updated: new Date().toISOString()
      })
      .eq('id', receiverWallet.id);

    // Cancel transaction
    const { data: cancelledTx, error: cancelError } = await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (cancelError) {
      return res.status(500).json({
        error: 'Failed to cancel transaction',
        code: 'CANCEL_FAILED'
      });
    }

    res.status(200).json({
      id: cancelledTx.id,
      status: cancelledTx.status,
      cancelled_at: cancelledTx.cancelled_at,
      refund_amount: transaction.amount_sent,
      refund_currency: transaction.from_currency
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
