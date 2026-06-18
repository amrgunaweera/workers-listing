import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMenu2, IconX, IconBriefcase, IconGlobe } from '@tabler/icons-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkerProfile from './pages/WorkerProfile';
import AdminDashboard from './pages/AdminDashboard';
import { Button } from './components/ui/button';

function Navbar() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = () => {
    const langs = ['en', 'si', 'ta'];
    const currentIndex = langs.indexOf(i18n.language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    i18n.changeLanguage(nextLang);
  };

  const currentLangLabel = i18n.language === 'si' ? 'සිංහල' : i18n.language === 'ta' ? 'தமிழ்' : 'EN';

  return (
    <nav className="fixed w-full z-50 top-0 border-b border-white/10 glass bg-white/5 dark:bg-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
              <IconBriefcase className="h-6 w-6" />
              <span className="hidden sm:block">WorkLink</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="hover:bg-primary/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.home')}
              </Link>
              <Link to="/login" className="hover:bg-primary/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="hover:bg-primary/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.register')}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-2 hidden sm:flex">
              <IconGlobe className="h-4 w-4" />
              {currentLangLabel}
            </Button>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-primary/10 focus:outline-none"
              >
                {isOpen ? <IconX className="block h-6 w-6" /> : <IconMenu2 className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden glass absolute w-full left-0 top-16">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
            <Link to="/" onClick={() => setIsOpen(false)} className="hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium">
              {t('nav.home')}
            </Link>
            <Link to="/login" onClick={() => setIsOpen(false)} className="hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium">
              {t('nav.login')}
            </Link>
            <Link to="/register" onClick={() => setIsOpen(false)} className="hover:bg-primary/10 block px-3 py-2 rounded-md text-base font-medium">
              {t('nav.register')}
            </Link>
            <button onClick={toggleLanguage} className="flex items-center gap-2 text-left hover:bg-primary/10 w-full px-3 py-2 rounded-md text-base font-medium">
              <IconGlobe className="h-5 w-5" />
              Language: {currentLangLabel}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-auto py-8 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} WorkLink. All rights reserved.</p>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
        <Navbar />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<WorkerProfile />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
