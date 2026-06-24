import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBriefcase, IconEye, IconEyeOff } from '@tabler/icons-react';

import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const buildSchema = (t) =>
  z.object({
    emailOrPhone: z
      .string()
      .min(1, t('auth.validation.emailOrPhoneFieldRequired')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  });

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showRoleModal, setShowRoleModal] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    }
  }, [currentUser, userRole, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: {
      emailOrPhone: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      let loginEmail = data.emailOrPhone.trim();
      if (/^\+?[0-9]+$/.test(loginEmail)) {
        loginEmail = `worker-${loginEmail}@bestservicelk.com`;
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: data.password
      });
      if (authError) throw authError;

      const user = authData.user;

      const { data: userDoc, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (user.user_metadata?.requires_password_change) {
        navigate('/force-password-change');
      } else if (userDoc?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      console.error(err);
      setServerError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="gradient-orb w-[400px] h-[400px] bg-primary/15 top-[-100px] right-[-100px]" />
      <div className="gradient-orb w-[250px] h-[250px] bg-accent/20 bottom-[-50px] left-[-50px]" />

      <Card className="relative w-full max-w-md bg-card border-border/40 border shadow-xl [--card-spacing:--spacing(6)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <IconBriefcase className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{t('auth.loginTitle')}</CardTitle>
          <CardDescription>
            {t('auth.loginDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/10 border border-red-500/20 rounded-md">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone">{t('auth.emailOrPhone')}</Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="john.doe@example.com or 0712345678"
                className={`bg-background/50 ${errors.emailOrPhone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                {...register('emailOrPhone')}
              />
              {errors.emailOrPhone && (
                <p className="text-xs text-red-500 mt-1">{errors.emailOrPhone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`bg-background/50 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>
            <Button className="w-full mt-4" type="submit" disabled={loading}>
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <button
              onClick={() => setShowRoleModal(true)}
              className="font-medium text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
            >
              {t('auth.registerNow')}
            </button>
          </div>
        </CardContent>
      </Card>

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card p-6 rounded-xl border border-border shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold text-center mb-4 text-foreground">
              {t('auth.chooseRegisterType')}
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  navigate('/register?role=user');
                }}
                className="w-full py-3 px-4 rounded-lg border border-border bg-background hover:bg-muted font-medium text-sm transition-colors text-left flex justify-between items-center cursor-pointer"
              >
                <span>{t('nav.needService')}</span>
                <span className="text-muted-foreground text-xs font-normal">→</span>
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  navigate('/register?role=worker');
                }}
                className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-colors text-left flex justify-between items-center cursor-pointer"
              >
                <span>{t('nav.provideService')}</span>
                <span className="text-primary-foreground/85 text-xs font-normal">→</span>
              </button>
            </div>
            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full mt-4 text-center text-sm text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              {t('auth.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
