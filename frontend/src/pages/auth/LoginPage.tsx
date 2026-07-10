import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import PageTransition from '@/components/common/PageTransition';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <AuthLayout>
        <LoginForm
          onSuccessRedirect={() => navigate('/dashboard')}
          onSignUpClick={() => navigate('/register')}
        />
      </AuthLayout>
    </PageTransition>
  );
};

export default LoginPage;
