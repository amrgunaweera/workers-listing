import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { IconStarFilled, IconMapPin } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function WorkerCard({ worker }) {
  const { t } = useTranslation();

  return (
    <Link to={`/profile?id=${worker.id}`} className="block group">
      <Card className="overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 glass bg-white/5 dark:bg-black/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={worker.avatar} alt={worker.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {worker.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {worker.name}
                </h3>
                <Badge variant="secondary" className="mt-1 font-normal bg-primary/10 text-primary hover:bg-primary/20">
                  {t(`categories.${worker.category.toLowerCase()}`)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-md text-sm font-medium">
              <IconStarFilled className="h-4 w-4" />
              <span>{worker.rating}</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
            <IconMapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{worker.location}</span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {worker.bio}
          </p>

        </CardContent>
      </Card>
    </Link>
  );
}
