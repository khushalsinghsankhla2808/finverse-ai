import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Mail, Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import { motion } from 'framer-motion';

const loginSchema = zod.object({
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
  password: zod.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: zod.boolean().optional(),
});

type LoginFields = zod.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccessRedirect: () => void;
  onSignUpClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccessRedirect, onSignUpClick }) => {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFields) => {
    try {
      setAuthError(null);
      await login(data.email, data.password);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccessRedirect();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Failed to sign in. Please verify your email and password.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
      setIsSuccess(true);
      setTimeout(() => {
        onSuccessRedirect();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold font-display tracking-tight text-white">Welcome back</h2>
        <p className="text-sm text-white/50">Enter your credentials to access your dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Email Address</label>
          <Input
            type="email"
            placeholder="name@example.com"
            leftIcon={<Mail size={18} />}
            error={errors.email?.message}
            disabled={isLoading || isSuccess}
            {...register('email')}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Password</label>
            <a href="#forgot" className="text-xs font-medium text-purple-light hover:text-purple-primary transition-colors">
              Forgot password?
            </a>
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/40 hover:text-white/70 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            error={errors.password?.message}
            disabled={isLoading || isSuccess}
            {...register('password')}
          />
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center justify-between mt-1">
          <Checkbox
            label="Remember me on this device"
            disabled={isLoading || isSuccess}
            {...register('rememberMe')}
          />
        </div>

        {/* Auth Error Display */}
        {authError && (
          <div className="text-xs text-red-negative font-medium bg-red-negative/10 border border-red-negative/20 px-3 py-2 rounded-lg mt-1">
            ⚠️ {authError}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="relative mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-linear-to-r from-purple-primary to-purple-light px-4 py-2 text-sm font-semibold text-white shadow-glow-purple transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer overflow-hidden"
        >
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Check size={18} className="text-green-positive" />
              <span>Success! Redirecting...</span>
            </motion.div>
          ) : isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <span className="relative bg-bg-card px-3 text-xs text-white/40 uppercase tracking-wider">
          or continue with
        </span>
      </div>

      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading || isSuccess}
        className="flex h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/3 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/8 active:scale-[0.98] cursor-pointer"
      >
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" viewBox="0 0 488 512">
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          />
        </svg>
        Google
      </button>

      {/* Bottom Link */}
      <div className="text-center text-sm text-white/50 mt-2">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSignUpClick}
          className="font-semibold text-purple-light hover:text-purple-primary transition-colors cursor-pointer"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
