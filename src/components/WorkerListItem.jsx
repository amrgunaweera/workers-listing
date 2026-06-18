import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/badge';
import { normalizeCategory } from '../lib/categories';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { IconStarFilled, IconMapPin } from '@tabler/icons-react';
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
                <Badge variant="secondary" className="font-normal text-xs bg-primary/10 text-primary hover:bg-primary/20">
                  {t(`categories.${normalizeCategory(worker.category)}`)}
                </Badge>
              </div>
              
              <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-sm">
                <IconMapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span className="truncate">{worker.location}</span>
              </div>
              
              <p className="mt-2 text-sm text-muted-foreground/80 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                {worker.bio}
              </p>
            </div>
          </div>

          {/* Right side: Rating & Action */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-yellow-500/10 shadow-sm">
              <IconStarFilled className="h-4 w-4 text-yellow-500" />
              <span>{worker.rating}</span>
            </div>
            <span className="text-xs text-primary font-semibold group-hover:underline hidden sm:inline-block mt-2">
              {t('worker.viewProfile') || 'View Profile'} &rarr;
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
}
