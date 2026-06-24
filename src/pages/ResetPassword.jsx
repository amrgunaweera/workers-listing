import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { IconLock, IconEye, IconEyeOff, IconCheck } from '@tabler/icons-react';

import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const buildSchema = (t) => z.object({
  password: z.string().min(6, t('auth.validation.passwordMin', 'Password must be at least 6 characters.')),
  confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired', 'Please confirm your new password.')),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.validation.passwordsMustMatch', "Passwords do not match."),
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // When clicking the link, Supabase sets the session from the URL hash implicitly.
  // We don't need a strict useEffect checking for session to allow the form to render, 
  // but if the user tries to submit without a session, the updateUser call will fail nicely.

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
        data: { requires_password_change: false } // Also clear this flag just in case
      });

      if (error) throw error;
      
      setSuccessMessage(t('auth.passwordUpdated', 'Password updated successfully! Redirecting...'));
      
      // Redirect to appropriate dashboard/profile after a short delay so they can see the success message
      setTimeout(() => {
        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/profile');
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      setServerError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="gradient-orb w-[400px] h-[400px] bg-primary/15 top-[-100px] right-[-100px]" />
      <div className="gradient-orb w-[250px] h-[250px] bg-accent/20 bottom-[-50px] left-[-50px]" />

      <Card className="relative w-full max-w-md bg-card border-border/40 shadow-xl [--card-spacing:--spacing(6)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <IconLock className="h-5 w-5 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.resetPasswordTitle2', 'Set New Password')}</CardTitle>
          <CardDescription>
            {t('auth.resetPasswordDesc2', 'Please enter your new password below.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/10 border border-red-500/20 rounded-md">
              {serverError}
            </div>
          )}
          {successMessage && (
            <div className="p-3 mb-4 text-sm text-green-600 bg-green-100/10 border border-green-500/20 rounded-md flex items-center gap-2">
              <IconCheck className="w-4 h-4" />
              {successMessage}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.newPassword', 'New Password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`bg-background/50 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  {...register('password')}
                  disabled={!!successMessage || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  disabled={!!successMessage || loading}
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword', 'Confirm New Password')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`bg-background/50 pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  {...register('confirmPassword')}
                  disabled={!!successMessage || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  disabled={!!successMessage || loading}
                >
                  {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button className="w-full mt-6" type="submit" disabled={loading || !!successMessage}>
              {loading ? t('auth.updatingPassword', 'Updating...') : t('auth.updatePassword', 'Update Password')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
