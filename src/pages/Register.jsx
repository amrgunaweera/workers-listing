import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(urlRole === 'worker' ? 'worker' : 'user');

  useEffect(() => {
    if (urlRole) {
      setRole(urlRole === 'worker' ? 'worker' : 'user');
    }
  }, [urlRole]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const registerEmail = email.trim() || `worker-${phone.trim()}@bestbaas.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        phone: phone.trim() || null,
        role: role,
        createdAt: new Date().toISOString()
      });

      if (role === 'worker') {
        await setDoc(doc(db, 'workers', user.uid), {
          id: user.uid,
          name: `${firstName} ${lastName}`.trim(),
          category: 'Helper', // Default category
          rating: 0,
          location: 'Not specified',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}`,
          bio: 'New worker on the platform.',
          phone: phone.trim(),
          available: true,
          userId: user.uid
        });
      }

      navigate(role === 'worker' ? `/profile?id=${user.uid}` : '/');
    } catch (err) {
      console.error(err);
      setError(t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/10">
      <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border-border/40 border shadow-md [--card-spacing:--spacing(6)]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">{t('auth.registerTitle')}</CardTitle>
          <CardDescription>
            {t('auth.registerDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/10 border border-red-500/20 rounded-md">{error}</div>}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" required className="bg-background/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('auth.email')} {role === 'worker' && <span className="text-muted-foreground text-xs font-normal">({t('auth.optional')})</span>}
              </Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john.doe@example.com" required={role !== 'worker'} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                {t('auth.phone')} {role !== 'worker' && <span className="text-muted-foreground text-xs font-normal">({t('auth.optional')})</span>}
              </Label>
              <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678" required={role === 'worker'} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="bg-background/50" />
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
