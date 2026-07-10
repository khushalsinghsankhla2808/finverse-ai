import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';
import PageTransition from '@/components/common/PageTransition';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <AuthLayout>
        <RegisterForm
          onSuccessRedirect={() => navigate('/dashboard')}
          onSignInClick={() => navigate('/login')}
        />
      </AuthLayout>
    </PageTransition>
  );
};

export default RegisterPage;
