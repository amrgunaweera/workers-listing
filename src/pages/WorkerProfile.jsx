import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { normalizeCategory } from '../lib/categories';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSearchParams } from 'react-router-dom';
import { IconMapPin, IconStarFilled, IconPhone } from '@tabler/icons-react';

export default function WorkerProfile() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchWorker = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'workers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWorker({ id: docSnap.id, ...docSnap.data() });
        } else {
          setWorker(null);
        }
      } catch (error) {
        console.error("Error fetching worker:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorker();
  }, [id]);
  
  // Simulation of edit mode for the worker themselves
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold tracking-tight">Worker not found</h2>
        <p className="text-muted-foreground mt-2">The worker profile you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card className="border-border/40 overflow-hidden border shadow-lg bg-card">
        {/* Taller, richer gradient banner */}
        <div className="h-40 bg-gradient-to-r from-primary/25 via-primary/40 to-accent/20 relative">
          <Avatar className="h-28 w-28 absolute -bottom-14 left-8 border-4 border-background ring-4 ring-primary/20">
            <AvatarImage src={worker.avatar} alt={worker.name} />
            <AvatarFallback className="text-xl font-bold">{worker.name.substring(0,2)}</AvatarFallback>
          </Avatar>
        </div>
        
        <CardContent className="pt-18 pb-8 px-8 sm:px-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{worker.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="default" className="text-sm">
                  {t(`categories.${normalizeCategory(worker.category)}`)}
                </Badge>
                <div className="flex items-center gap-1 text-yellow-500 font-medium bg-yellow-500/10 px-2.5 py-0.5 rounded-md">
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
            <h3 className="text-lg font-semibold mb-3">About Me</h3>
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
