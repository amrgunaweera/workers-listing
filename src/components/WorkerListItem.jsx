import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { IconStarFilled, IconMapPin } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function WorkerListItem({ worker }) {
  const { t } = useTranslation();

  return (
    <Link to={`/profile?id=${worker.id}`} className="block group border-b border-border/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300">
      <div className="py-6 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left side: Avatar + Info */}
          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
            <Avatar className="h-16 w-16 border border-primary/20 shrink-0">
              <AvatarImage src={worker.avatar} alt={worker.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {worker.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                  {worker.name}
                </h3>
                <Badge variant="secondary" className="font-normal bg-primary/10 text-primary hover:bg-primary/20">
                  {t(`categories.${worker.category.toLowerCase()}`)}
                </Badge>
              </div>
              
              <div className="mt-1 flex items-center gap-1 text-muted-foreground text-sm">
                <IconMapPin className="h-4 w-4 shrink-0 text-primary/70" />
                <span className="truncate">{worker.location}</span>
              </div>
              
              <p className="mt-2 text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">
                {worker.bio}
              </p>
            </div>
          </div>

          {/* Right side: Rating & Action */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-md text-sm font-semibold">
              <IconStarFilled className="h-4 w-4" />
              <span>{worker.rating}</span>
            </div>
            <span className="text-xs text-primary font-medium group-hover:underline hidden sm:inline-block mt-2">
              {t('worker.viewProfile') || 'View Profile'} &rarr;
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
}
