import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Mail, Lock, User, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import { motion } from 'framer-motion';

const registerSchema = zod
  .object({
    name: zod.string().min(2, 'Name must be at least 2 characters'),
    email: zod.string().min(1, 'Email is required').email('Invalid email address'),
    password: zod
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: zod.string().min(1, 'Please confirm your password'),
    agreeTerms: zod.boolean().refine((val) => val === true, 'You must agree to the terms'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFields = zod.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccessRedirect: () => void;
  onSignInClick: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccessRedirect, onSignInClick }) => {
  const { register: registerAuth, isLoading } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const passwordVal = useWatch({ control, name: 'password' }) || '';
  const [strengthScore, setStrengthScore] = useState(0);

  useEffect(() => {
    let score = 0;
    if (passwordVal.length >= 8) score += 1;
    if (/[A-Z]/.test(passwordVal)) score += 1;
    if (/[0-9]/.test(passwordVal)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwordVal)) score += 1;
    setStrengthScore(score);
  }, [passwordVal]);

  const onSubmit = async (data: RegisterFields) => {
    try {
      setAuthError(null);
      await registerAuth(data.name, data.email, data.password);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccessRedirect();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Failed to create account. Email may already be in use.');
    }
  };

  const strengthLabels = ['Too Short', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-white/10', // 0
    'bg-red-negative shadow-glow-red', // 1
    'bg-orange-500 shadow-lg shadow-orange-500/20', // 2
    'bg-gold-savings shadow-glow-gold', // 3
    'bg-green-positive shadow-glow-green', // 4
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold font-display tracking-tight text-white">Create your account</h2>
        <p className="text-sm text-white/50">Start tracking your wealth in 3D AI environment</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Full Name</label>
          <Input
            type="text"
            placeholder="John Doe"
            leftIcon={<User size={18} />}
            error={errors.name?.message}
            disabled={isLoading || isSuccess}
            {...register('name')}
          />
        </div>

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
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            error={errors.password?.message}
            disabled={isLoading || isSuccess}
            {...register('password')}
          />

          {/* Password Strength Meter */}
          {passwordVal.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40">Password strength:</span>
                <span
                  className={
                    strengthScore === 1
                      ? 'text-red-negative font-medium'
                      : strengthScore === 2
                      ? 'text-orange-400 font-medium'
                      : strengthScore === 3
                      ? 'text-gold-savings font-medium'
                      : strengthScore === 4
                      ? 'text-green-positive font-medium'
                      : 'text-white/40'
                  }
                >
                  {strengthLabels[strengthScore]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="relative w-full h-full bg-white/5 rounded-full"
                  >
                    {strengthScore >= index && (
                      <motion.div
                        layoutId="strength-bar"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.3 }}
                        className={`h-full w-full rounded-full ${strengthColors[strengthScore]}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Confirm Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            error={errors.confirmPassword?.message}
            disabled={isLoading || isSuccess}
            {...register('confirmPassword')}
          />
        </div>

        {/* Terms checkbox */}
        <div className="flex flex-col gap-1 mt-1">
          <Checkbox
            label={
              <span>
                I agree to the{' '}
                <a href="#terms" className="text-purple-light hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-purple-light hover:underline">
                  Privacy Policy
                </a>
              </span>
            }
            disabled={isLoading || isSuccess}
            {...register('agreeTerms')}
          />
          {errors.agreeTerms && (
            <span className="text-xs text-red-negative ml-6 mt-0.5">
              {errors.agreeTerms.message}
            </span>
          )}
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
              <span>Account Created! Redirecting...</span>
            </motion.div>
          ) : isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Creating account...</span>
            </div>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* Bottom Link */}
      <div className="text-center text-sm text-white/50 mt-1">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSignInClick}
          className="font-semibold text-purple-light hover:text-purple-primary transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
