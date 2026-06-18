import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

export default function Login() {
  const { t } = useTranslation();

  const handleLogin = (e) => {
    e.preventDefault();
    // Mock login logic
    alert("Mock login submitted.");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background to-primary/5">
      <Card className="w-full max-w-md glass border-border/40 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" required className="bg-background/50" />
            </div>
            <Button className="w-full mt-4" type="submit">
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register now
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
