import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  IconSearch, 
  IconHammer, 
  IconWall, 
  IconDroplet, 
  IconPlant, 
  IconUsers,
  IconGridPattern,
  IconPlug,
  IconBrush,
  IconMountain,
  IconSettings,
  IconBriefcase,
  IconFlame,
  IconSnowflake,
  IconStack,
  IconSofa,
  IconTruck,
  IconBucket,
  IconFrame,
  IconArrowBarUp,
  IconArmchair,
  IconKey,
  IconSparkles,
  IconCar,
  IconVideo,
  IconSun,
  IconWindow,
  IconPackage,
  IconBug,
  IconBuilding,
  IconTools
} from '@tabler/icons-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import { categories } from '../lib/categories';

const categoryIcons = {
  'masons': <IconWall className="w-7 h-7 mb-2 text-primary" />,
  'carpenters': <IconHammer className="w-7 h-7 mb-2 text-primary" />,
  'tile': <IconGridPattern className="w-7 h-7 mb-2 text-primary" />,
  'plumbers': <IconDroplet className="w-7 h-7 mb-2 text-primary" />,
  'electricians': <IconPlug className="w-7 h-7 mb-2 text-primary" />,
  'painters': <IconBrush className="w-7 h-7 mb-2 text-primary" />,
  'landscaping': <IconPlant className="w-7 h-7 mb-2 text-primary" />,
  'stones-sand-soil': <IconMountain className="w-7 h-7 mb-2 text-primary" />,
  'equipment-repairing': <IconSettings className="w-7 h-7 mb-2 text-primary" />,
  'contractors': <IconBriefcase className="w-7 h-7 mb-2 text-primary" />,
  'welding': <IconFlame className="w-7 h-7 mb-2 text-primary" />,
  'professionals': <IconBriefcase className="w-7 h-7 mb-2 text-primary" />,
  'ac': <IconSnowflake className="w-7 h-7 mb-2 text-primary" />,
  'concrete-slab': <IconStack className="w-7 h-7 mb-2 text-primary" />,
  'cushion-works': <IconSofa className="w-7 h-7 mb-2 text-primary" />,
  'gully-bowser': <IconTruck className="w-7 h-7 mb-2 text-primary" />,
  'well': <IconBucket className="w-7 h-7 mb-2 text-primary" />,
  'aluminium': <IconFrame className="w-7 h-7 mb-2 text-primary" />,
  'ceiling': <IconArrowBarUp className="w-7 h-7 mb-2 text-primary" />,
  'chair-weavers': <IconArmchair className="w-7 h-7 mb-2 text-primary" />,
  'rent-tools': <IconKey className="w-7 h-7 mb-2 text-primary" />,
  'cleaners': <IconSparkles className="w-7 h-7 mb-2 text-primary" />,
  'vehicle-repairs': <IconCar className="w-7 h-7 mb-2 text-primary" />,
  'cctv': <IconVideo className="w-7 h-7 mb-2 text-primary" />,
  'solar-panel-fixing': <IconSun className="w-7 h-7 mb-2 text-primary" />,
  'curtains': <IconWindow className="w-7 h-7 mb-2 text-primary" />,
  'movers': <IconPackage className="w-7 h-7 mb-2 text-primary" />,
  'pest-control': <IconBug className="w-7 h-7 mb-2 text-primary" />,
  'house-demolishers': <IconBuilding className="w-7 h-7 mb-2 text-primary" />,
  'repairs-others': <IconTools className="w-7 h-7 mb-2 text-primary" />
};

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
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-28 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10">
        {/* Decorative gradient orbs */}
        <div className="gradient-orb w-[500px] h-[500px] bg-primary/20 top-[-100px] right-[-150px]" />
        <div className="gradient-orb w-[300px] h-[300px] bg-accent/30 bottom-[-50px] left-[-80px]" />
        <div className="gradient-orb w-[200px] h-[200px] bg-primary/15 top-[40%] left-[20%]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Sri Lanka's #1 Workers Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto bg-card p-2 rounded-2xl flex items-center border border-border/50 shadow-lg focus-within:ring-2 ring-primary/50 transition-all duration-300">
            <div className="pl-4 text-muted-foreground">
              <IconSearch className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder={t('hero.searchPlaceholder')}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-4 h-12 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" size="lg" className="rounded-xl px-6 h-10 hidden sm:flex font-semibold">
              Search
            </Button>
          </form>

          {/* Social proof */}
          <p className="mt-4 text-xs text-muted-foreground">
            Trusted by <span className="font-semibold text-foreground">500+</span> professionals across Sri Lanka
          </p>

          {/* Browse Categories */}
          <div className="mt-16 px-4 sm:px-12 relative max-w-6xl mx-auto">
            <p className="text-xs text-muted-foreground mb-6 font-semibold uppercase tracking-widest text-center">{t('categories.browse') || 'Browse Categories'}</p>
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4 sm:-ml-6">
                {Array.from({ length: Math.ceil(categories.length / 2) }).map((_, index) => {
                  const chunk = categories.slice(index * 2, index * 2 + 2);
                  return (
                    <CarouselItem key={index} className="pl-4 sm:pl-6 basis-auto">
                      <div className="flex flex-col gap-4 sm:gap-6">
                        {chunk.map(catId => {
                          const icon = categoryIcons[catId] || <IconTools className="w-7 h-7 mb-2 text-primary" />;
                          return (
                            <Button
                              key={catId}
                              variant="ghost"
                              className="flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card hover:bg-card border border-border/50 hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 whitespace-normal"
                              onClick={() => navigateToCategory(catId)}
                            >
                              {icon}
                              <span className="text-xs font-medium text-foreground text-center line-clamp-2">{t(`categories.${catId}`)}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4 sm:-left-12" />
              <CarouselNext className="hidden sm:flex -right-4 sm:-right-12" />
            </Carousel>
          </div>
        </div>
      </section>
    </div>
  );
}
