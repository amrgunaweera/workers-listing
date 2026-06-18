import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconHammer, IconWall, IconDroplet, IconPlant, IconUsers } from '@tabler/icons-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/workers?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/workers`);
    }
  };

  const navigateToCategory = (category) => {
    navigate(`/workers?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-800" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            {t('hero.title')}
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto glass p-2 rounded-full flex items-center border border-border/50 focus-within:ring-2 ring-primary transition-all duration-300">
            <div className="pl-4 text-muted-foreground">
              <IconSearch className="h-6 w-6" />
            </div>
            <Input
              type="text"
              placeholder={t('hero.searchPlaceholder')}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg px-4 h-12 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" size="lg" className="rounded-full px-8 hidden sm:flex">
              Search
            </Button>
          </form>

          {/* Browse Categories Quick Links */}
          <div className="mt-12">
            <p className="text-sm text-muted-foreground mb-6 font-medium uppercase tracking-wider">{t('categories.browse') || 'Browse Categories'}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              {[
                { id: 'carpenter', icon: <IconHammer className="w-8 h-8 mb-2 text-primary" /> },
                { id: 'mason', icon: <IconWall className="w-8 h-8 mb-2 text-primary" /> },
                { id: 'plumber', icon: <IconDroplet className="w-8 h-8 mb-2 text-primary" /> },
                { id: 'gardener', icon: <IconPlant className="w-8 h-8 mb-2 text-primary" /> },
                { id: 'helper', icon: <IconUsers className="w-8 h-8 mb-2 text-primary" /> }
              ].map(cat => (
                <Button
                  key={cat.id}
                  variant="ghost"
                  className="flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/60 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60 hover:-translate-y-1 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:border-primary/40 dark:hover:border-primary/40 transition-all duration-300"
                  onClick={() => navigateToCategory(cat.id)}
                >
                  {cat.icon}
                  <span className="text-sm font-medium text-foreground">{t(`categories.${cat.id}`)}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
