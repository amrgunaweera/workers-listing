import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { mockWorkers } from '../lib/mockData';
import { useSearchParams } from 'react-router-dom';
import { IconMapPin, IconStarFilled, IconPhone } from '@tabler/icons-react';

export default function WorkerProfile() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const worker = mockWorkers.find(w => w.id === parseInt(id)) || mockWorkers[0];
  
  // Simulation of edit mode for the worker themselves
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card className="glass border-border/40 overflow-hidden shadow-xl">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/40 to-secondary/20 relative">
          <Avatar className="h-24 w-24 absolute -bottom-12 left-6 border-4 border-background shadow-lg">
            <AvatarImage src={worker.avatar} alt={worker.name} />
            <AvatarFallback>{worker.name.substring(0,2)}</AvatarFallback>
          </Avatar>
        </div>
        
        <CardContent className="pt-16 pb-8 px-6 sm:px-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{worker.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="default" className="text-sm">
                  {t(`categories.${worker.category.toLowerCase()}`)}
                </Badge>
                <div className="flex items-center gap-1 text-yellow-500 font-medium bg-yellow-500/10 px-2 py-0.5 rounded">
                  <IconStarFilled className="h-4 w-4" />
                  {worker.rating}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconMapPin className="h-5 w-5 text-primary" />
                <span>{worker.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconPhone className="h-5 w-5 text-primary" />
                <span>{worker.phone}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3">About Me</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Input defaultValue={worker.bio} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue={worker.phone} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input defaultValue={worker.location} className="bg-background/50" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground leading-relaxed">
                  {worker.bio}
                </p>
                <Button className="mt-6" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile (Demo)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
