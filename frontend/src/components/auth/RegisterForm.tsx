import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Mail, Lock, User, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import { Link } from 'react-router-dom';

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
    'bg-surface-sunken',
    'bg-red-500',
    'bg-amber-500',
    'bg-blue-500',
    'bg-emerald-500',
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold font-sans tracking-tight text-ink">Create your account</h2>
        <p className="text-sm text-ink-muted">Create your FinVerse AI account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Full Name</label>
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
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Email Address</label>
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
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Password</label>
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
                <span className="text-ink-subtle">Password strength:</span>
                <span className="font-medium text-ink">
                  {strengthLabels[strengthScore]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-surface-sunken rounded-[var(--radius-control)] overflow-hidden">
                {[1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="relative w-full h-full bg-surface-sunken rounded-[var(--radius-control)]"
                  >
                    {strengthScore >= index && (
                      <div
                        className={`h-full w-full rounded-[var(--radius-control)] ${strengthColors[strengthScore]}`}
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
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Confirm Password</label>
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
                <Link to="/terms" className="text-link hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-link hover:underline">
                  Privacy Policy
                </Link>
              </span>
            }
            disabled={isLoading || isSuccess}
            {...register('agreeTerms')}
          />
          {errors.agreeTerms && (
            <span className="text-xs amount-loss ml-6 mt-0.5">
              {errors.agreeTerms.message}
            </span>
          )}
        </div>

        {/* Auth Error Display */}
        {authError && (
          <div className="text-xs amount-loss font-medium bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-[var(--radius-control)] mt-1">
            {authError}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="btn btn-primary w-full mt-2"
        >
          {isSuccess ? (
            <div className="flex items-center gap-2">
              <Check size={18} />
              <span>Account Created! Redirecting...</span>
            </div>
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
      <div className="text-center text-sm text-ink-muted mt-1">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSignInClick}
          className="font-semibold text-link hover:text-link-hover transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
