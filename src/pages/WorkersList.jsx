import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import WorkerListItem from '../components/WorkerListItem';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { IconSearch, IconX } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import { sriLankaLocations, allDistricts } from '../lib/locations';

const categories = ['all', 'carpenter', 'mason', 'plumber', 'gardener', 'helper'];

export default function WorkersList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const queryParam = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedDistrict = searchParams.get('district') || 'all';
  const selectedTown = searchParams.get('town') || 'all';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [prevQueryParam, setPrevQueryParam] = useState(queryParam);

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
        const querySnapshot = await getDocs(collection(db, 'workers'));
        const workersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWorkers(workersData);
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
      if (!w.location || w.location === 'Not specified') return null;
      const parts = w.location.split(',').map(s => s.trim());
      return parts.length > 1 ? parts[1] : parts[0];
    }).filter(Boolean);
    
    const combined = Array.from(new Set([...allDistricts, ...dynamicDistricts])).sort();
    return ['all', ...combined];
  }, [workers]);

  // Extract towns based on selected district, including any dynamic towns for that district
  const towns = useMemo(() => {
    const staticTowns = selectedDistrict !== 'all' ? (sriLankaLocations[selectedDistrict] || []) : [];
    
    const dynamicTowns = workers.map(w => {
      if (!w.location || w.location === 'Not specified') return null;
      const parts = w.location.split(',').map(s => s.trim());
      const workerDistrict = parts.length > 1 ? parts[1] : parts[0];
      const workerTown = parts[0];
      
      if (selectedDistrict !== 'all' && workerDistrict !== selectedDistrict) {
        return null;
      }
      return workerTown;
    }).filter(Boolean);
    
    const combinedTowns = Array.from(new Set([...staticTowns, ...dynamicTowns])).sort();
    return ['all', ...combinedTowns];
  }, [workers, selectedDistrict]);

  const filteredWorkers = workers.filter(worker => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = worker.name?.toLowerCase().includes(query) || 
                          worker.location?.toLowerCase().includes(query) ||
                          worker.bio?.toLowerCase().includes(query);
    
    const matchesCategory = selectedCategory === 'all' || worker.category?.toLowerCase() === selectedCategory;
    
    let matchesDistrict = true;
    let matchesTown = true;
    
    if (worker.location && worker.location !== 'Not specified') {
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
          <div className="w-full lg:w-64 shrink-0 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">{t('filters.title') || 'Filters'}</h3>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconSearch className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder={t('hero.searchPlaceholder') || 'Search...'}
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* District Filter */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
                  {t('worker.district') || 'District'}
                </label>
                <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                  <SelectTrigger className="w-full bg-transparent border-border/80 text-foreground justify-between">
                    <span data-slot="select-value" className="flex flex-1 text-left">
                      {selectedDistrict === 'all' ? t('categories.all') || 'All' : selectedDistrict}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {districts.map(d => (
                      <SelectItem key={d} value={d}>
                        {d === 'all' ? t('categories.all') || 'All' : d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Town Filter */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
                  {t('worker.town') || 'Town'}
                </label>
                <Select value={selectedTown} onValueChange={handleTownChange} disabled={selectedDistrict === 'all'}>
                  <SelectTrigger className="w-full bg-transparent border-border/80 text-foreground justify-between disabled:opacity-50">
                    <span data-slot="select-value" className="flex flex-1 text-left">
                      {selectedTown === 'all' ? t('categories.all') || 'All' : selectedTown}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {towns.map(tw => (
                      <SelectItem key={tw} value={tw}>
                        {tw === 'all' ? t('categories.all') || 'All' : tw}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">{t('categories.browse') || 'Categories'}</h4>
                <div className="space-y-2 flex flex-col">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "secondary" : "ghost"}
                      className={`justify-start w-full transition-colors ${selectedCategory === cat ? 'bg-primary/10 text-primary font-medium' : ''}`}
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
                {t('workersList.resultsTitle') || 'Search Results'}
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
              <div className="flex flex-col border-t border-border/40">
                {filteredWorkers.map(worker => (
                  <WorkerListItem key={worker.id} worker={worker} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 glass rounded-2xl bg-white/5 dark:bg-black/20 border border-border/50">
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

          {/* Right Sidebar Advert */}
          <div className="w-full lg:w-60 shrink-0">
            <div className="glass p-4 rounded-2xl bg-white/5 dark:bg-black/20 border border-border/50 text-center sticky top-24">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-3">
                {t('advertisement') || 'Advertisement'}
              </span>
              {/* Google Ads Placeholder container */}
              <div className="relative flex flex-col items-center justify-center min-h-[500px] w-full rounded-xl bg-muted/30 border border-dashed border-border/70 overflow-hidden group/ad hover:border-primary/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 opacity-50 group-hover/ad:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 px-4 text-center">
                  {/* Styled Google Ads text */}
                  <div className="font-semibold text-sm tracking-wider text-muted-foreground group-hover/ad:text-primary transition-colors">
                    Google Ads
                  </div>
                  <div className="text-xs text-muted-foreground/60 mt-1 max-w-[150px] mx-auto">
                    Responsive Skyscraper Banner Placement
                  </div>
                </div>
                {/* Simulated tiny AdChoices icon */}
                <div className="absolute top-1.5 right-1.5 bg-background/80 dark:bg-foreground/10 px-1.5 py-0.5 rounded text-[8px] font-sans text-muted-foreground/80 flex items-center gap-0.5 pointer-events-none select-none">
                  <span>AdChoices</span>
                  <span className="text-[6px] font-bold">ⓘ</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
