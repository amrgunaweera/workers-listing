import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  IconTools,
  IconHome,
  IconHeartHandshake,
  IconBabyCarriage,
  IconStethoscope,
  IconActivity,
  IconSwimming,
  IconBarbell,
  IconUserHeart,
  IconBook
} from '@tabler/icons-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import { categories, normalizeCategory } from '../lib/categories';

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
  'housemaid': <IconHome className="w-7 h-7 mb-2 text-primary" />,
  'elder-care': <IconHeartHandshake className="w-7 h-7 mb-2 text-primary" />,
  'child-care': <IconBabyCarriage className="w-7 h-7 mb-2 text-primary" />,
  'nursing-home': <IconStethoscope className="w-7 h-7 mb-2 text-primary" />,
  'physiotherapy': <IconActivity className="w-7 h-7 mb-2 text-primary" />,
  'swimming-instructor': <IconSwimming className="w-7 h-7 mb-2 text-primary" />,
  'fitness-instructor': <IconBarbell className="w-7 h-7 mb-2 text-primary" />,
  'counseling': <IconUserHeart className="w-7 h-7 mb-2 text-primary" />,
  'tuition-master': <IconBook className="w-7 h-7 mb-2 text-primary" />,
  'repairs-others': <IconTools className="w-7 h-7 mb-2 text-primary" />
};

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPendingBanner, setShowPendingBanner] = useState(searchParams.get('registered') === 'pending');

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const transA = t(`categories.${normalizeCategory(a)}`, a);
      const transB = t(`categories.${normalizeCategory(b)}`, b);
      return transA.localeCompare(transB);
    });
  }, [t]);

  const carouselItems = useMemo(() => {
    return Array.from({ length: Math.ceil(sortedCategories.length / 2) }).map((_, index) => {
      const chunk = sortedCategories.slice(index * 2, index * 2 + 2);
      return (
        <CarouselItem key={index} className="pl-4 sm:pl-6 basis-auto">
          <div className="flex flex-col gap-4 sm:gap-6">
            {chunk.map(catId => {
              const rawIcon = categoryIcons[normalizeCategory(catId)] || <IconTools className="w-7 h-7 mb-2 text-primary" />;
              const icon = React.cloneElement(rawIcon, {
                className: "size-6 mb-2 text-primary transition-transform duration-300 group-hover:scale-110"
              });
              return (
                <Button
                  key={catId}
                  variant="ghost"
                  className="group flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card hover:bg-card border border-border/50 hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 whitespace-normal cursor-pointer"
                  onClick={() => navigateToCategory(catId)}
                >
                  {icon}
                  <span className="text-xs font-medium text-foreground text-center line-clamp-2">{t(`categories.${normalizeCategory(catId)}`, catId)}</span>
                </Button>
              );
            })}
          </div>
        </CarouselItem>
      );
    });
  }, [sortedCategories, t]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/workers?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/workers`);
    }
  };

  const navigateToCategory = (category) => {
    navigate(`/workers?category=${encodeURIComponent(normalizeCategory(category))}`);
  };

  return (
    <div className="min-h-screen">
      {/* Pending registration banner */}
      {showPendingBanner && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
            <span className="text-lg">⏳</span>
            <span>
              <strong>Your account is under review.</strong> An admin will activate your profile shortly. You'll appear in search results once approved.
            </span>
          </div>
          <button onClick={() => setShowPendingBanner(false)} className="text-amber-600 dark:text-amber-400 hover:text-amber-800 shrink-0 cursor-pointer">
            ✕
          </button>
        </div>
      )}
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10">
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

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto bg-card p-2 rounded-2xl flex items-center border border-border/50 shadow-lg focus-within:ring-2 ring-primary/50 transition-all duration-300">
            <button type="submit" className="pl-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer focus:outline-none">
              <IconSearch className="h-5 w-5" />
            </button>
            <Input
              type="text"
              placeholder={t('hero.searchPlaceholder', 'Search...')}
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
        </div>
      </section>

      {/* Browse Categories */}
      <section className="w-full bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30 py-12 sm:py-16 border-y border-border/50 relative overflow-hidden">
        <div className="w-full px-4 sm:px-8 relative">
          <p className="text-xs text-muted-foreground mb-8 font-semibold uppercase tracking-widest text-center">{t('categories.browse', 'Browse Categories')}</p>
          <Carousel
            opts={{
              align: "start",
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 sm:-ml-6 py-2">
              {carouselItems}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex left-2 sm:left-4 z-10" />
            <CarouselNext className="hidden sm:flex right-2 sm:right-4 z-10" />
          </Carousel>
        </div>
      </section>

      {/* Promotional Banner */}
      <div className="relative w-full overflow-hidden group cursor-pointer border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop"
          alt="Professional workers"
          className="w-full h-64 sm:h-72 md:h-80 object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-start px-6 sm:px-12 md:px-24 lg:px-32 text-left">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-4 shadow-lg shadow-primary/20">
            {t('banner.badge', 'SPECIAL OFFER')}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white max-w-md sm:max-w-lg leading-tight mb-3 drop-shadow-md">
            {t('banner.title', 'Need Urgent Repairs?')}
          </h2>
          <p className="text-zinc-200 text-sm sm:text-base max-w-sm sm:max-w-md drop-shadow-sm">
            {t('banner.subtitle', 'Book our verified professionals today and get guaranteed quality service.')}
          </p>
        </div>
      </div>
    </div>
  );
}
