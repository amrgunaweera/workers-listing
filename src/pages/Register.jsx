import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Link } from 'react-router-dom';

export default function Register() {
  const { t } = useTranslation();

  const handleRegister = (e) => {
    e.preventDefault();
    // Mock register logic
    alert("Mock registration submitted.");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/10">
      <Card className="w-full max-w-md glass border-border/40 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>
            Join as a worker to list your services, or as a user to hire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" required className="bg-background/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue="user">
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Looking to Hire (User)</SelectItem>
                  <SelectItem value="worker">Looking for Work (Worker)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required className="bg-background/50" />
            </div>
            <Button className="w-full mt-4" type="submit">
              Register
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
