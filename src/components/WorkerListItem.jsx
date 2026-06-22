import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/badge';
import { normalizeCategory } from '../lib/categories';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { IconMapPin } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function WorkerListItem({ worker }) {
  const { t } = useTranslation();

  return (
    <Link to={`/profile?id=${worker.id}`} className="block group bg-card border border-border/60 hover:border-primary/45 rounded-xl shadow-sm hover:shadow transition-all duration-300 relative overflow-hidden">
      {/* Left accent bar on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
      
      <div className="py-5 px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left side: Avatar + Info */}
          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
            <Avatar className="h-16 w-16 border-2 border-primary/10 ring-2 ring-background shrink-0 shadow-sm">
              <AvatarImage src={worker.avatar} alt={worker.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {worker.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                  {worker.name}
                </h3>
                {(Array.isArray(worker.categories) && worker.categories.length > 0
                  ? worker.categories
                  : [worker.category]
                ).filter(Boolean).map(cat => (
                  <Badge key={cat} variant="secondary" className="font-normal text-xs bg-primary/10 text-primary hover:bg-primary/20">
                    {t(`categories.${normalizeCategory(cat)}`)}
                  </Badge>
                ))}
              </div>
              
              <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-sm">
                <IconMapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span className="truncate">
                  {Array.isArray(worker.locations) && worker.locations.length > 0 ? (
                    worker.locations.map((loc, idx) => (
                      <span key={idx}>
                        {loc.town}{idx < worker.locations.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  ) : (
                    worker.location
                  )}
                </span>
              </div>
              
              <p className="mt-2 text-sm text-muted-foreground/80 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                {worker.bio}
              </p>
            </div>
          </div>

          {/* Right side: Action */}
          <div className="hidden sm:flex sm:flex-col items-end justify-center gap-2 shrink-0">
            <span className="text-xs text-primary font-semibold group-hover:underline mt-2">
              {t('worker.viewProfile', 'View Profile')} &rarr;
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
}
