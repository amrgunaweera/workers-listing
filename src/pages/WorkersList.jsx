import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import WorkerListItem from '../components/WorkerListItem';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { IconSearch, IconX } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import { sriLankaLocations, allDistricts } from '../lib/locations';
import { categories as importedCategories, normalizeCategory } from '../lib/categories';

const categories = ['all', ...importedCategories];

export default function WorkersList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const queryParam = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedDistrict = searchParams.get('district') || 'all';
  const selectedTown = searchParams.get('town') || 'all';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [prevQueryParam, setPrevQueryParam] = useState(queryParam);

  const sortedCategories = useMemo(() => {
    return ['all', ...[...importedCategories].sort((a, b) => t(`categories.${a}`).localeCompare(t(`categories.${b}`)))];
  }, [t]);

  if (queryParam !== prevQueryParam) {
    setPrevQueryParam(queryParam);
    setSearchQuery(queryParam);
  }

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('workers').select('*');
        if (error) throw error;
        setWorkers(data || []);
      } catch (error) {
        console.error("Error fetching workers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    updateUrlParams(searchQuery, selectedCategory, selectedDistrict, selectedTown);
  };

  const handleCategoryChange = (cat) => {
    updateUrlParams(searchQuery, cat, selectedDistrict, selectedTown);
  };

  const handleDistrictChange = (district) => {
    updateUrlParams(searchQuery, selectedCategory, district, 'all');
  };

  const handleTownChange = (town) => {
    updateUrlParams(searchQuery, selectedCategory, selectedDistrict, town);
  };

  const updateUrlParams = (q, cat, district, town) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat && cat !== 'all') params.set('category', cat);
    if (district && district !== 'all') params.set('district', district);
    if (town && town !== 'all') params.set('town', town);
    setSearchParams(params);
  };

  // Use static districts from Sri Lanka locations, and include any dynamic ones just in case
  const districts = useMemo(() => {
    const dynamicDistricts = workers.map(w => {
      if (Array.isArray(w.locations) && w.locations.length > 0) {
        return w.locations.map(l => l.district);
      }
      if (!w.location || w.location === 'Not specified') return null;
      const parts = w.location.split(',').map(s => s.trim());
      return parts.length > 1 ? parts[1] : parts[0];
    }).flat().filter(Boolean);
    
    const combined = Array.from(new Set([...allDistricts, ...dynamicDistricts])).sort();
    return ['all', ...combined];
  }, [workers]);

  // Extract towns based on selected district, including any dynamic towns for that district
  const towns = useMemo(() => {
    const staticTowns = selectedDistrict !== 'all' ? (sriLankaLocations[selectedDistrict] || []) : [];
    
    const dynamicTowns = workers.map(w => {
      if (Array.isArray(w.locations) && w.locations.length > 0) {
        return w.locations
          .filter(l => selectedDistrict === 'all' || l.district === selectedDistrict)
          .map(l => l.town);
      }
      if (!w.location || w.location === 'Not specified') return null;
      const parts = w.location.split(',').map(s => s.trim());
      const workerDistrict = parts.length > 1 ? parts[1] : parts[0];
      const workerTown = parts[0];
      
      if (selectedDistrict !== 'all' && workerDistrict !== selectedDistrict) {
        return null;
      }
      return workerTown;
    }).flat().filter(Boolean);
    
    const combinedTowns = Array.from(new Set([...staticTowns, ...dynamicTowns])).sort();
    return ['all', ...combinedTowns];
  }, [workers, selectedDistrict]);

  const filteredWorkers = workers.filter(worker => {
    // Only show active/approved workers publicly
    if (!worker.available || worker.status === 'pending') return false;

    const query = searchQuery.toLowerCase().trim();

    // Support both single category (legacy) and categories array (new)
    const workerCats = Array.isArray(worker.categories) && worker.categories.length > 0
      ? worker.categories
      : [worker.category || ''];
    const catText = workerCats.join(' ').toLowerCase();

    const locTextMatch = Array.isArray(worker.locations) && worker.locations.length > 0
      ? worker.locations.some(l => l.district.toLowerCase().includes(query) || l.town.toLowerCase().includes(query))
      : String(worker.location || '').toLowerCase().includes(query);

    const matchesSearch = !query ||
                          String(worker.name || '').toLowerCase().includes(query) ||
                          locTextMatch ||
                          String(worker.bio || '').toLowerCase().includes(query) ||
                          catText.includes(query);

    const matchesCategory = selectedCategory === 'all' ||
      workerCats.some(c => normalizeCategory(c) === selectedCategory);

    let matchesDistrict = true;
    let matchesTown = true;

    if (Array.isArray(worker.locations) && worker.locations.length > 0) {
      if (selectedDistrict !== 'all' && selectedTown !== 'all') {
        matchesDistrict = worker.locations.some(l => l.district === selectedDistrict && l.town === selectedTown);
        matchesTown = matchesDistrict;
      } else if (selectedDistrict !== 'all') {
        matchesDistrict = worker.locations.some(l => l.district === selectedDistrict);
      } else if (selectedTown !== 'all') {
        matchesTown = worker.locations.some(l => l.town === selectedTown);
      }
    } else if (worker.location && worker.location !== 'Not specified') {
      const parts = worker.location.split(',').map(s => s.trim());
      const workerTown = parts[0];
      const workerDistrict = parts.length > 1 ? parts[1] : parts[0];

      if (selectedDistrict !== 'all') {
        matchesDistrict = workerDistrict === selectedDistrict;
      }
      if (selectedTown !== 'all') {
        matchesTown = workerTown === selectedTown;
      }
    } else if (selectedDistrict !== 'all' || selectedTown !== 'all') {
      return false;
    }
    return matchesSearch && matchesCategory && matchesDistrict && matchesTown;
  });

  const hasActiveFilters = selectedCategory !== 'all' || selectedDistrict !== 'all' || selectedTown !== 'all' || searchQuery !== '';

  const handleClearAll = () => {
    setSearchQuery('');
    updateUrlParams('', 'all', 'all', 'all');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-60 shrink-0 space-y-6">
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-border/20">
              <h3 className="text-xs font-semibold mb-3 text-muted-foreground/70 uppercase tracking-wider">{t('filters.title', 'Filters')}</h3>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-4 relative">
                <button type="submit" className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer focus:outline-none">
                  <IconSearch className="h-3.5 w-3.5" />
                </button>
                <Input
                  type="text"
                  placeholder={t('hero.searchPlaceholder', 'Search...')}
                  className="pl-8 w-full h-8 text-xs bg-background/50 border-border/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* District Filter */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider block mb-1">
                  {t('worker.district', 'District')}
                </label>
                <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                  <SelectTrigger className="w-full h-8 text-xs bg-background/50 border-border/60 text-foreground justify-between">
                    <span data-slot="select-value" className="flex flex-1 text-left">
                      {selectedDistrict === 'all' ? t('categories.all', 'All') : selectedDistrict}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {districts.map(d => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d === 'all' ? t('categories.all', 'All') : d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Town Filter */}
              <div className="mb-4">
                <label className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider block mb-1">
                  {t('worker.town', 'Town')}
                </label>
                <Select value={selectedTown} onValueChange={handleTownChange} disabled={selectedDistrict === 'all'}>
                  <SelectTrigger className="w-full h-8 text-xs bg-background/50 border-border/60 text-foreground justify-between disabled:opacity-50">
                    <span data-slot="select-value" className="flex flex-1 text-left">
                      {selectedTown === 'all' ? t('categories.all', 'All') : selectedTown}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {towns.map(tw => (
                      <SelectItem key={tw} value={tw} className="text-xs">
                        {tw === 'all' ? t('categories.all', 'All') : tw}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">{t('categories.browse', 'Categories')}</h4>
                <div className="space-y-1 flex flex-col max-h-[350px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
                  {sortedCategories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "secondary" : "ghost"}
                      className={`justify-start w-full h-8 shrink-0 text-xs transition-colors ${selectedCategory === cat ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground/80 hover:text-foreground'}`}
                      onClick={() => handleCategoryChange(cat)}
                    >
                      {t(`categories.${cat}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Main Content */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t('workersList.resultsTitle', 'Search Results')}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
                <p className="text-muted-foreground text-sm">
                  Showing {filteredWorkers.length} {filteredWorkers.length === 1 ? 'result' : 'results'}
                </p>
                
                {hasActiveFilters && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs text-primary hover:underline font-medium text-left cursor-pointer transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Active Filter Badges */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs">
                      <span>Search: "{searchQuery}"</span>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          updateUrlParams('', selectedCategory, selectedDistrict, selectedTown);
                        }}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs">
                      <span>Category: {t(`categories.${selectedCategory}`)}</span>
                      <button 
                        onClick={() => handleCategoryChange('all')}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedDistrict !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs">
                      <span>District: {selectedDistrict}</span>
                      <button 
                        onClick={() => handleDistrictChange('all')}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedTown !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs">
                      <span>Town: {selectedTown}</span>
                      <button 
                        onClick={() => handleTownChange('all')}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredWorkers.length > 0 ? (
              <div className="flex flex-col gap-4">
                {filteredWorkers.map(worker => (
                  <WorkerListItem key={worker.id} worker={worker} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 rounded-xl bg-card border border-border/40 shadow-sm">
                <h3 className="text-xl font-semibold text-foreground mb-2">No workers found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search query or filters.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    handleCategoryChange('all');
                    handleDistrictChange('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar Advert (Less Prominent) */}
          <div className="w-full lg:w-60 shrink-0">
            <div className="p-3 rounded-xl bg-card border border-border/30 text-center">
              <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-widest block mb-2 select-none">
                {t('advertisement', 'Advertisement')}
              </span>
              {/* Google Ads Placeholder container - non-prominent styling */}
              <div className="relative flex flex-col items-center justify-center h-[200px] w-full rounded-lg bg-muted/5 border border-dashed border-border/30 overflow-hidden">
                <div className="relative z-10 px-2 text-center select-none pointer-events-none">
                  <div className="font-semibold text-xs tracking-wider text-muted-foreground/40">
                    Google Ads
                  </div>
                  <div className="text-[10px] text-muted-foreground/30 mt-0.5">
                    Ad Placement
                  </div>
                </div>
                {/* Simulated tiny AdChoices icon */}
                <div className="absolute top-1 right-1 bg-background/20 dark:bg-foreground/5 px-1 py-0.2 rounded text-[6px] font-sans text-muted-foreground/30 flex items-center gap-0.5 pointer-events-none select-none">
                  <span>AdChoices</span>
                  <span className="text-[5px] font-bold">ⓘ</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
