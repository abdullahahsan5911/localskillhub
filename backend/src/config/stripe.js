import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn('STRIPE_SECRET_KEY is not configured. Stripe payments will be disabled.');
}

/**
 * Shared Stripe instance for the backend.
 * Make sure STRIPE_SECRET_KEY is set in the environment.
 */
export const stripe = secretKey
  ? new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    })
  : null;

export default stripe;
