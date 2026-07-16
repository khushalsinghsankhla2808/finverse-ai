import dotenv from 'dotenv';
import * as z from 'zod';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string({ required_error: 'MONGODB_URI is required' }),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default('your-cloud-name'),
  CLOUDINARY_API_KEY: z.string().optional().default('your-api-key'),
  CLOUDINARY_API_SECRET: z.string().optional().default('your-api-secret'),
  MISTRAL_API_KEY: z.string().optional().default('your-mistral-api-key'),
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
