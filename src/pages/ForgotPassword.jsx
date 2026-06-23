import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBriefcase } from '@tabler/icons-react';

import { supabase } from '../lib/supabase';

const buildSchema = (t) =>
  z.object({
    email: z
      .string()
      .min(1, t('auth.validation.emailRequired'))
      .email(t('auth.validation.emailInvalid')),
  });

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [serverError, setServerError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim(), { redirectTo: window.location.origin + '/reset-password' });
      if (error) throw error;
      setMessage(t('auth.resetEmailSent'));
    } catch (err) {
      console.error(err);
      setServerError(t('auth.resetError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="gradient-orb w-[350px] h-[350px] bg-primary/15 top-[-80px] right-[-80px]" />
      <div className="gradient-orb w-[200px] h-[200px] bg-accent/20 bottom-[-40px] left-[-40px]" />

      <Card className="relative w-full max-w-md bg-card border-border/40 border shadow-xl [--card-spacing:--spacing(6)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <IconBriefcase className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription>
            {t('auth.forgotPasswordDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/10 border border-red-500/20 rounded-md">
              {serverError}
            </div>
          )}
          {message && (
            <div className="p-3 mb-4 text-sm text-green-600 bg-green-100/10 border border-green-500/20 rounded-md">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
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

            <Button className="w-full mt-4" type="submit" disabled={loading}>
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
