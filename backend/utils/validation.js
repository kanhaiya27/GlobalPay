import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^\+\d{10,}$/, 'Phone must start with + and have at least 10 digits')
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const KYCVerifySchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  full_name: z.string().min(2, 'Full name required'),
  id_type: z.enum(['passport', 'drivers_license', 'national_id'], {
    errorMap: () => ({ message: 'Invalid ID type' })
  }),
  id_number: z.string().min(5, 'ID number required')
});

export const WalletDepositSchema = z.object({
  currency: z.enum(['USD', 'EUR', 'INR', 'GBP'], {
    errorMap: () => ({ message: 'Invalid currency' })
  }),
  amount: z.number().positive('Amount must be positive')
});

export const ExchangeRateSchema = z.object({
  from: z.enum(['USD', 'EUR', 'INR', 'GBP'], {
    errorMap: () => ({ message: 'Invalid from currency' })
  }),
  to: z.enum(['USD', 'EUR', 'INR', 'GBP'], {
    errorMap: () => ({ message: 'Invalid to currency' })
  })
});

export const MatchFindSchema = z.object({
  from_currency: z.enum(['USD', 'EUR', 'INR', 'GBP']),
  to_currency: z.enum(['USD', 'EUR', 'INR', 'GBP']),
  amount: z.number().positive('Amount must be positive')
});

export const TransactionCreateSchema = z.object({
  receiver_id: z.string().uuid('Invalid receiver ID'),
  amount_send: z.number().positive('Amount must be positive'),
  from_currency: z.enum(['USD', 'EUR', 'INR', 'GBP']),
  to_currency: z.enum(['USD', 'EUR', 'INR', 'GBP'])
});

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
