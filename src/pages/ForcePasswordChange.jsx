import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { IconLock, IconEye, IconEyeOff } from '@tabler/icons-react';

import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string().min(1, 'Please confirm your new password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ForcePasswordChange() {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if the user actually needs a password change
    if (currentUser) {
      if (!currentUser.user_metadata?.requires_password_change) {
        if (userRole === 'admin') navigate('/admin');
        else navigate('/profile');
      }
    } else {
      navigate('/login');
    }
  }, [currentUser, userRole, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
        data: { requires_password_change: false }
      });

      if (error) throw error;
      
      navigate('/profile');
    } catch (err) {
      console.error(err);
      setServerError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="gradient-orb w-[400px] h-[400px] bg-primary/15 top-[-100px] right-[-100px]" />
      <div className="gradient-orb w-[250px] h-[250px] bg-accent/20 bottom-[-50px] left-[-50px]" />

      <Card className="relative w-full max-w-md bg-card border-border/40 shadow-xl [--card-spacing:--spacing(6)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <IconLock className="h-5 w-5 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Set Your Password</CardTitle>
          <CardDescription>
            For your security, please choose a new password for your account before continuing.
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
              <Label htmlFor="password">New Password</Label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button className="w-full mt-6" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
