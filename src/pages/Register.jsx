import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { IconBriefcase, IconEye, IconEyeOff } from '@tabler/icons-react';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function buildSchema(role, t) {
  return z
    .object({
      firstName: z.string().min(1, t('auth.validation.firstNameRequired')),
      lastName: z.string().min(1, t('auth.validation.lastNameRequired')),
      email:
        role === 'worker'
          ? z.string().email(t('auth.validation.emailInvalid')).or(z.literal('')).optional()
          : z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
      phone: z
        .string()
        .min(1, t('auth.validation.phoneRequired'))
        .regex(/^[0-9+\s\-()]{7,15}$/, t('auth.validation.phoneInvalid')),
      password: z
        .string()
        .min(6, t('auth.validation.passwordMin')),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    });
}

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role');
  const role = urlRole === 'worker' ? 'worker' : 'user';

  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  useEffect(() => {
    if (currentUser && userRole && !loading) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    }
  }, [currentUser, userRole, navigate, loading]);

  const schema = buildSchema(role, t);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    reset();
    setServerError('');
  }, [role, reset]);

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const registerEmail =
        data.email?.trim() || `worker-${data.phone.trim()}@bestservicelk.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerEmail,
        password: data.password,
      });

      if (authError) throw authError;

      const user = authData.user;

      if (!user) throw new Error("No user returned from signUp");

      await supabase.from('users').insert([{
        id: user.id,
        email: user.email,
        phone: data.phone?.trim() || null,
        role: role,
        createdAt: new Date().toISOString(),
      }]);

      if (role === 'worker') {
        await supabase.from('workers').insert([{
          id: user.id,
          name: `${data.firstName} ${data.lastName}`.trim(),
          categories: [],
          category: 'repairs-others',
          rating: 0,
          location: 'Not specified',
          locations: [],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName + ' ' + data.lastName)}`,
          bio: 'New worker on the platform.',
          phone: data.phone?.trim(),
          available: false,
          status: 'pending',
          userId: user.id,
          createdAt: new Date().toISOString(),
        }]);
      }

      navigate(role === 'worker' ? '/?registered=pending' : '/');
    } catch (err) {
      console.error(err);
      setServerError(t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/10 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="gradient-orb w-[350px] h-[350px] bg-accent/20 top-[-80px] left-[-100px]" />
      <div className="gradient-orb w-[300px] h-[300px] bg-primary/15 bottom-[-80px] right-[-80px]" />

      <Card className="relative w-full max-w-md bg-card border-border/40 border shadow-xl [--card-spacing:--spacing(6)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <IconBriefcase className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{t('auth.registerTitle')}</CardTitle>
          <CardDescription>
            {t('auth.registerDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/10 border border-red-500/20 rounded-md">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  className={`bg-background/50 ${errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className={`bg-background/50 ${errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {t('auth.email')}{' '}
                {role === 'worker' && (
                  <span className="text-muted-foreground text-xs font-normal">({t('auth.optional')})</span>
                )}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                className={`bg-background/50 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678"
                className={`bg-background/50 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`bg-background/50 pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button className="w-full mt-4" type="submit" disabled={loading}>
              {loading ? t('auth.registering') : t('auth.register')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.signInLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
