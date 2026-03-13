import express from 'express';
import { supabase } from '../utils/supabase.js';
import { MatchFindSchema } from '../utils/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /match/find
router.post('/find', authenticateToken, async (req, res) => {
  try {
    const { from_currency, to_currency, amount } = MatchFindSchema.parse(req.body);

    // Find potential matches using the same query from documentation
    const { data: matches, error } = await supabase.rpc(
      'find_potential_matches',
      {
        p_user_id: req.user.id,
        p_opposite_currency: to_currency,
        p_amount: amount
      }
    );

    if (error) {
      // If RPC doesn't exist, use fallback query
      const { data: fallbackMatches, error: fallbackError } = await supabase
        .from('users')
        .select(
          `
          id,
          wallets!inner(balance, currency)
        `
        )
        .eq('kyc_verified', true)
        .eq('wallets.currency', to_currency)
        .filter('wallets.balance', 'gte', amount * 0.9)
        .filter('wallets.balance', 'lte', amount * 1.1)
        .neq('id', req.user.id)
        .limit(3);

      if (fallbackError) {
        return res.status(500).json({
          error: 'Failed to find matches',
          code: 'MATCH_SEARCH_ERROR'
        });
      }

      const formattedMatches = fallbackMatches.map((user) => ({
        user_id: user.id,
        match_score: 85,
        their_amount: user.wallets[0]?.balance || 0,
        their_currency: to_currency,
        currency_pair: `${from_currency}-${to_currency}`
      }));

      return res.status(200).json({
        matches: formattedMatches,
        found: formattedMatches.length > 0,
        message: formattedMatches.length > 0 ? `${formattedMatches.length} matches found` : 'No matches available'
      });
    }

    const formattedMatches = matches.map((match) => ({
      user_id: match.match_user_id,
      match_score: match.match_score_proximity * 100,
      their_amount: match.match_balance,
      their_currency: to_currency,
      currency_pair: `${from_currency}-${to_currency}`
    }));

    res.status(200).json({
      matches: formattedMatches,
      found: formattedMatches.length > 0,
      message: formattedMatches.length > 0 ? `${formattedMatches.length} matches found` : 'No matches available'
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
