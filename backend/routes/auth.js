import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase, handleSupabaseError } from '../utils/supabase.js';
import { generateToken } from '../utils/jwt.js';
import { SignupSchema, LoginSchema, KYCVerifySchema } from '../utils/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, phone } = SignupSchema.parse(req.body);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        phone,
        kyc_verified: false
      })
      .select()
      .single();

    if (userError) {
      const errorResponse = handleSupabaseError(userError);
      return res.status(errorResponse.status).json({
        error: errorResponse.message,
        code: errorResponse.code
      });
    }

    // Create wallets for all currencies
    const { error: walletError } = await supabase.from('wallets').insert([
      { user_id: user.id, currency: 'USD', balance: 0.0 },
      { user_id: user.id, currency: 'EUR', balance: 0.0 },
      { user_id: user.id, currency: 'INR', balance: 0.0 },
      { user_id: user.id, currency: 'GBP', balance: 0.0 }
    ]);

    if (walletError) {
      // Cleanup user if wallet creation fails
      await supabase.from('users').delete().eq('id', user.id);
      return res.status(500).json({
        error: 'Failed to create wallets',
        code: 'WALLET_CREATION_FAILED'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      kyc_verified: user.kyc_verified,
      token,
      created_at: user.created_at
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
      error: 'Signup failed',
      code: 'SIGNUP_FAILED'
    });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'AUTH_FAILED'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'AUTH_FAILED'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(200).json({
      id: user.id,
      email: user.email,
      kyc_verified: user.kyc_verified,
      token
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
      error: 'Login failed',
      code: 'LOGIN_FAILED'
    });
  }
});

// POST /kyc/verify
router.post('/kyc/verify', authenticateToken, async (req, res) => {
  try {
    const { full_name, id_type, id_number } = KYCVerifySchema.parse({
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
