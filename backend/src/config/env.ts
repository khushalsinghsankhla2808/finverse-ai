import dotenv from 'dotenv';
import * as z from 'zod';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string({ required_error: 'MONGODB_URI is required' }),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }).min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string({ required_error: 'JWT_REFRESH_SECRET is required' }),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default('your-cloud-name'),
  CLOUDINARY_API_KEY: z.string().optional().default('your-api-key'),
  CLOUDINARY_API_SECRET: z.string().optional().default('your-api-secret'),
  GEMINI_API_KEY: z.string().optional().default('your-gemini-api-key'),
  EMAIL_HOST: z.string().optional().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().optional().default(587),
  EMAIL_USER: z.string().optional().default('your-email@gmail.com'),
  EMAIL_PASS: z.string().optional().default('your-app-password'),
  CLIENT_URL: z.string().optional(),
  BACKEND_URL: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional().default('your-firebase-project-id'),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default('your-firebase-client-email'),
  FIREBASE_PRIVATE_KEY: z.string().optional().default('your-firebase-private-key'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.errors.forEach((err) => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
  throw new Error('Invalid environment variables. Stopping server.');
}

export const env = parsed.data;
export default env;
