import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch } from '@tabler/icons-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import WorkerCard from '../components/WorkerCard';
import { mockWorkers } from '../lib/mockData';

const categories = ['all', 'carpenter', 'mason', 'plumber', 'gardener', 'helper'];

export default function Home() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredWorkers = mockWorkers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          worker.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          worker.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || worker.category.toLowerCase() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-800" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 drop-shadow-sm">
            {t('hero.title')}
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <div className="mt-10 max-w-2xl mx-auto glass p-2 rounded-full flex items-center shadow-lg focus-within:ring-2 ring-primary transition-all duration-300">
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
            <Button size="lg" className="rounded-full px-8 hidden sm:flex">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="rounded-full px-6 transition-all duration-300 shadow-sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {t(`categories.${cat}`)}
            </Button>
          ))}
        </div>

        {/* Workers Grid */}
        {filteredWorkers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkers.map(worker => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold text-muted-foreground">No workers found.</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your search query or category.</p>
          </div>
        )}
      </section>
    </div>
  );
}
