import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../utils/supabase.js';
import { KYCVerifySchema } from '../utils/validation.js';

const router = express.Router();

// POST /verify - Verify KYC for a user
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const parsed = KYCVerifySchema.parse({
      user_id: req.user.id,
      ...req.body
    });

    // Update KYC status (instant approval for MVP)
    const { data: user, error: kycError } = await supabase
      .from('users')
      .update({
        kyc_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (kycError) {
      return res.status(500).json({
        error: 'KYC verification failed',
        code: 'KYC_FAILED'
      });
    }

    res.status(200).json({
      id: user.id,
      kyc_verified: user.kyc_verified,
      message: 'KYC verified successfully'
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
      error: 'KYC verification failed',
      code: 'KYC_FAILED'
    });
  }
});

export default router;
