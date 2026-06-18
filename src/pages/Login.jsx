import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showRoleModal, setShowRoleModal] = React.useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let loginEmail = email.trim();
      if (/^\+?[0-9]+$/.test(loginEmail)) {
        loginEmail = `worker-${loginEmail}@bestbaas.com`;
      }
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;
      
      // Check if user is admin
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        navigate('/admin');
      } else {
        // Just navigate to home for regular users for now
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background to-primary/5">
      <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border-border/40 border shadow-md [--card-spacing:--spacing(6)]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">{t('auth.loginTitle')}</CardTitle>
          <CardDescription>
            {t('auth.loginDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/10 border border-red-500/20 rounded-md">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.emailOrPhone')}</Label>
              <Input id="email" type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="john.doe@example.com or 0712345678" required className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="bg-background/50" />
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
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border border-border shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold text-center mb-4 text-foreground">
              {t('auth.chooseRegisterType')}
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  navigate('/register?role=user');
                }}
                className="w-full py-3 px-4 rounded-md border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-900 font-medium text-sm transition-colors text-left flex justify-between items-center cursor-pointer"
              >
                <span>{t('nav.needService')}</span>
                <span className="text-muted-foreground text-xs font-normal">→</span>
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  navigate('/register?role=worker');
                }}
                className="w-full py-3 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-colors text-left flex justify-between items-center cursor-pointer"
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
