import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconMenu2,
  IconX,
  IconBriefcase,
  IconGlobe,
  IconBrandFacebook,
  IconBrandX,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandGooglePlay,
  IconBrandApple,
  IconUser,
  IconDashboard
} from '@tabler/icons-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkerProfile from './pages/WorkerProfile';
import AdminDashboard from './pages/AdminDashboard';
import WorkersList from './pages/WorkersList';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForcePasswordChange from './pages/ForcePasswordChange';
import { supabase } from './lib/supabase';

import { Button } from './components/ui/button';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoute';

function Navbar() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    navigate('/login');
  };

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
  };

  const currentLang = ['en', 'si', 'ta'].includes(i18n.language) ? i18n.language : 'en';

  return (
    <nav className="fixed w-full z-50 top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-primary">
              <IconBriefcase className="h-7 w-7" />
              <span className="hidden sm:block">BestService lk</span>
            </Link>
            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className="hover:bg-muted px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                {t('nav.home')}
              </Link>
              <Link to="/workers" className="hover:bg-muted px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                {t('nav.allAds')}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Auth links */}
            <div className="hidden md:flex items-center gap-1">
              {currentUser ? (
                <>
                  {userRole === 'admin' ? (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 hover:bg-muted px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <IconDashboard className="h-4 w-4" />
                      {t('nav.dashboard')}
                    </Link>
                  ) : (
                    <Link
                      to="/profile"
                      className="flex items-center gap-1.5 hover:bg-muted px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <IconUser className="h-4 w-4" />
                      {t('nav.myProfile', 'My Profile')}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="hover:bg-muted px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {t('nav.signOut', 'Sign Out')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/register?role=user" className="hover:bg-muted px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                    {t('nav.needService')}
                  </Link>
                  <Link to="/register?role=worker" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                    {t('nav.provideService')}
                  </Link>
                  <Link to="/login" className="hover:bg-muted px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                    {t('nav.login')}
                  </Link>
                </>
              )}
            </div>

            {/* Language Selector */}
            <div className="hidden sm:flex items-center rounded-full border border-border/60 overflow-hidden bg-muted/50">
              {currentLang !== 'en' && (
                <button
                  onClick={() => handleLanguageChange('en')}
                  className="px-3 py-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  EN
                </button>
              )}
              {currentLang !== 'si' && (
                <button
                  onClick={() => handleLanguageChange('si')}
                  className={`px-3 py-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted ${currentLang !== 'en' ? 'border-l border-border/60' : ''
                    }`}
                >
                  සිං
                </button>
              )}
              {currentLang !== 'ta' && (
                <button
                  onClick={() => handleLanguageChange('ta')}
                  className="px-3 py-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted border-l border-border/60"
                >
                  தமி
                </button>
              )}
            </div>

            <div className="-mr-2 flex md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <IconX className="block h-6 w-6" /> : <IconMenu2 className="block h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute w-full left-0 top-16 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-border/50 shadow-lg">
          <div className="px-4 pt-3 pb-4 space-y-1 flex flex-col">
            <Link to="/" onClick={() => setIsOpen(false)} className="hover:bg-muted block px-3 py-2.5 rounded-lg text-base font-medium transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/workers" onClick={() => setIsOpen(false)} className="hover:bg-muted block px-3 py-2.5 rounded-lg text-base font-medium transition-colors">
              {t('nav.allAds')}
            </Link>

            {currentUser ? (
              <>
                {userRole === 'admin' ? (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="hover:bg-muted flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-colors">
                    <IconDashboard className="h-4 w-4" />
                    {t('nav.dashboard')}
                  </Link>
                ) : (
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="hover:bg-muted flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-colors">
                    <IconUser className="h-4 w-4" />
                    {t('nav.myProfile', 'My Profile')}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground block px-3 py-2.5 rounded-lg text-base font-medium text-center mt-1 cursor-pointer transition-colors"
                >
                  {t('nav.signOut', 'Sign Out')}
                </button>
              </>
            ) : (
              <>
                <Link to="/register?role=user" onClick={() => setIsOpen(false)} className="hover:bg-muted block px-3 py-2.5 rounded-lg text-base font-medium transition-colors">
                  {t('nav.needService')}
                </Link>
                <Link to="/register?role=worker" onClick={() => setIsOpen(false)} className="bg-primary text-primary-foreground block px-3 py-2.5 rounded-lg text-base font-medium text-center mt-1">
                  {t('nav.provideService')}
                </Link>
                <Link to="/login" onClick={() => setIsOpen(false)} className="hover:bg-muted block px-3 py-2.5 rounded-lg text-base font-medium transition-colors">
                  {t('nav.login')}
                </Link>
              </>
            )}

            <div className="px-3 py-2 flex flex-col gap-2 mt-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <IconGlobe className="h-4 w-4" />
                <span>Language</span>
              </span>
              <div className="flex w-full items-center rounded-lg border border-border/60 overflow-hidden bg-muted/50">
                {currentLang !== 'en' && (
                  <button
                    onClick={() => { handleLanguageChange('en'); setIsOpen(false); }}
                    className="flex-1 text-center py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    English
                  </button>
                )}
                {currentLang !== 'si' && (
                  <button
                    onClick={() => { handleLanguageChange('si'); setIsOpen(false); }}
                    className={`flex-1 text-center py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted ${currentLang !== 'en' ? 'border-l border-border/60' : ''
                      }`}
                  >
                    සිංහල
                  </button>
                )}
                {currentLang !== 'ta' && (
                  <button
                    onClick={() => { handleLanguageChange('ta'); setIsOpen(false); }}
                    className="flex-1 text-center py-2 text-sm font-medium border-l border-border/60 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    தமிழ்
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="w-full bg-zinc-300/50 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 mt-auto pt-20 pb-10 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16 text-left">
          {/* Column 1: More from BestService lk */}
          <div>
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4 text-xs uppercase tracking-widest">{t('footer.moreTitle')}</h4>
            <ul className="space-y-3">
              <li><Link to="/register" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.postJob')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.membership')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.bannerAds')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.boostProfile')}</Link></li>
            </ul>
          </div>

          {/* Column 2: Help & Support */}
          <div>
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4 text-xs uppercase tracking-widest">{t('footer.helpTitle')}</h4>
            <ul className="space-y-3">
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.faq')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.staySafe')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.contactUs')}</Link></li>
            </ul>
          </div>

          {/* Column 3: About BestService lk */}
          <div>
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4 text-xs uppercase tracking-widest">{t('footer.aboutTitle')}</h4>
            <ul className="space-y-3">
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.careers')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.sitemap')}</Link></li>
            </ul>
          </div>

          {/* Column 4: Blog & Guides */}
          <div>
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4 text-xs uppercase tracking-widest">{t('footer.blogTitle')}</h4>
            <ul className="space-y-3 mb-6">
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.workerGuide')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.diyGuides')}</Link></li>
              <li><Link to="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">{t('footer.officialBlog')}</Link></li>
            </ul>
            <div className="flex space-x-3">
              <a href="#" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"><IconBrandFacebook className="h-5 w-5" /></a>
              <a href="#" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"><IconBrandX className="h-5 w-5" /></a>
              <a href="#" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"><IconBrandTiktok className="h-5 w-5" /></a>
              <a href="#" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"><IconBrandYoutube className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Column 5: Download our app */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4 text-xs uppercase tracking-widest">{t('footer.downloadTitle')}</h4>
            <div className="flex flex-col space-y-3">
              <a href="#" className="flex items-center gap-2.5 bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 hover:bg-zinc-950 dark:hover:bg-zinc-700/80 text-white px-4 py-2.5 rounded-lg transition-colors w-full sm:max-w-[170px]">
                <IconBrandGooglePlay className="h-6 w-6 text-primary" />
                <div className="text-left leading-none">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">GET IT ON</span>
                  <span className="text-xs font-semibold block mt-0.5">Google Play</span>
                </div>
              </a>
              <a href="#" className="flex items-center gap-2.5 bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 hover:bg-zinc-950 dark:hover:bg-zinc-700/80 text-white px-4 py-2.5 rounded-lg transition-colors w-full sm:max-w-[170px]">
                <IconBrandApple className="h-6 w-6 text-white" />
                <div className="text-left leading-none">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Download on</span>
                  <span className="text-xs font-semibold block mt-0.5">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-300 dark:border-zinc-800/85 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-zinc-800 dark:text-zinc-350 hover:text-zinc-950 dark:hover:text-white transition-colors">
            <IconBriefcase className="h-5 w-5 text-primary" />
            <span>BestService lk</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
          <Navbar />
          <main className="flex-1 pt-16">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/workers" element={<WorkersList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Route for forcing password change */}
              <Route path="/force-password-change" element={
                <RequireAuth>
                  <ForcePasswordChange />
                </RequireAuth>
              } />

              {/* Worker profile — public when ?id= is provided, protected for own profile */}
              <Route path="/profile" element={<WorkerProfile />} />

              {/* Admin only */}
              <Route path="/admin" element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
