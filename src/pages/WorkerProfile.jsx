import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { categories, normalizeCategory } from '../lib/categories';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { supabase } from '../lib/supabase';
import { useSearchParams, Link } from 'react-router-dom';
import { IconMapPin, IconPhone, IconEdit, IconCheck, IconX, IconUser, IconMail, IconArrowLeft, IconShieldCheck, IconAlertTriangle, IconClock, IconPlus, IconTrash, IconCalendar, IconStar } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { sriLankaLocations, allDistricts } from '../lib/locations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

/* ─────────────────── Helpers ─────────────────── */
const getFormattedJoinedDate = (dateVal) => {
  if (!dateVal) return null;
  let dateObj = null;
  if (typeof dateVal.toDate === 'function') {
    dateObj = dateVal.toDate();
  } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    dateObj = new Date(dateVal);
  } else if (dateVal instanceof Date) {
    dateObj = dateVal;
  } else if (dateVal.seconds) {
    dateObj = new Date(dateVal.seconds * 1000);
  }
  
  if (dateObj && !isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return null;
};

/* ─────────────────── Multi-Category Picker ─────────────────── */
function CategoryPicker({ selected, onChange }) {
  const toggle = (cat) => {
    if (selected.includes(cat)) {
      onChange(selected.filter(c => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
      {categories.map(cat => (
        <button
          key={cat}
          type="button"
          onClick={() => toggle(cat)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${selected.includes(cat)
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
            }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

/* ─── Zod schema for worker profile edit ─── */
const editSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  avatar: z.string().url('Must be a valid URL.').or(z.literal('')).optional(),
  categories: z.array(z.string()).min(1, 'Select at least one category.'),
  bio: z.string().max(500, 'Bio must be under 500 characters.').optional(),
  phone: z
    .string()
    .min(1, 'Phone number is required.')
    .regex(/^[0-9+\s\-()]{7,15}$/, 'Please enter a valid phone number.'),
  locations: z.array(
    z.object({
      district: z.string().min(1, 'District is required.'),
      town: z.string().min(1, 'Town is required.')
    })
  ).min(1, 'At least one location is required.'),
});

/* ─── Edit form for workers ─── */
function WorkerEditForm({ worker, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  let initialLocations = [{ district: '', town: '' }];
  if (Array.isArray(worker.locations) && worker.locations.length > 0) {
    initialLocations = worker.locations;
  } else if (worker.location && worker.location !== 'Not specified') {
    // Attempt to parse existing string. It might just be one word like "Colombo".
    initialLocations = [{ district: '', town: '' }];
    const parts = worker.location.split(',').map(s => s.trim());
    if (parts.length === 1) {
      if (allDistricts.includes(parts[0])) initialLocations[0].district = parts[0];
      else initialLocations[0].town = parts[0];
    } else if (parts.length >= 2) {
      // Very naive attempt
      initialLocations[0] = { district: parts[1], town: parts[0] };
    }
  }

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: worker.name || '',
      avatar: worker.avatar || '',
      categories: Array.isArray(worker.categories) && worker.categories.length > 0 ? worker.categories : (worker.category ? [worker.category] : []),
      bio: worker.bio || '',
      phone: worker.phone || '',
      locations: initialLocations,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'locations',
  });

  const onSubmit = async (data) => {
    setSaving(true);
    setServerError('');
    try {
      await onSave(data);
    } catch (err) {
      console.error("Save profile form error:", err);
      setServerError('Failed to save changes. ' + (err.message || 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = (errors) => {
    console.error("Form validation errors:", errors);
    setServerError("Please fix the validation errors in the form.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
      {serverError && (
        <div className="p-3 text-sm text-red-500 bg-red-100/10 border border-red-500/20 rounded-md">{serverError}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="ep-name">Full Name</Label>
        <Input
          id="ep-name"
          placeholder="e.g. Kamal Perera"
          className={`bg-background/50 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Categories <span className="text-muted-foreground font-normal text-xs">(select all that apply)</span></Label>
        <CategoryPicker 
          selected={watch('categories')} 
          onChange={(v) => setValue('categories', v, { shouldValidate: true })} 
        />
        {errors.categories && <p className="text-xs text-red-500">{errors.categories.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ep-bio">About / Bio</Label>
        <textarea
          id="ep-bio"
          rows={4}
          placeholder="Tell clients a bit about yourself and your skills..."
          className={`w-full rounded-md border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.bio ? 'border-red-500' : 'border-border/60'}`}
          {...register('bio')}
        />
        {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ep-phone">Phone Number</Label>
          <Input
            id="ep-phone"
            type="tel"
            placeholder="0712345678"
            className={`bg-background/50 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('phone')}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ep-avatar">Avatar URL</Label>
          <Input
            id="ep-avatar"
            placeholder="https://..."
            className={`bg-background/50 ${errors.avatar ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('avatar')}
          />
          {errors.avatar && <p className="text-xs text-red-500">{errors.avatar.message}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Locations</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ district: '', town: '' })}
            className="h-8 gap-1"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Add Location
          </Button>
        </div>
        
        {fields.map((field, index) => {
          const selectedDistrict = watch(`locations.${index}.district`);
          const availableTowns = selectedDistrict && sriLankaLocations[selectedDistrict] 
            ? sriLankaLocations[selectedDistrict] 
            : [];
            
          return (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start bg-muted/20 p-3 rounded-lg border border-border/50">
              <div className="space-y-1.5">
                <Select
                  value={watch(`locations.${index}.district`)}
                  onValueChange={(val) => {
                    setValue(`locations.${index}.district`, val, { shouldValidate: true });
                    setValue(`locations.${index}.town`, '', { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className={`w-full bg-background/50 ${errors.locations?.[index]?.district ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-60">
                    {allDistricts.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.locations?.[index]?.district && (
                  <p className="text-xs text-red-500">{errors.locations[index].district.message}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Select
                  value={watch(`locations.${index}.town`)}
                  onValueChange={(val) => setValue(`locations.${index}.town`, val, { shouldValidate: true })}
                  disabled={!selectedDistrict}
                >
                  <SelectTrigger className={`w-full bg-background/50 ${errors.locations?.[index]?.town ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Town" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-60">
                    {availableTowns.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.locations?.[index]?.town && (
                  <p className="text-xs text-red-500">{errors.locations[index].town.message}</p>
                )}
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="h-10 w-10 text-muted-foreground hover:text-red-500"
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {errors.locations?.root && <p className="text-xs text-red-500">{errors.locations.root.message}</p>}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="gap-2">
          <IconCheck className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
          <IconX className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ─── Main page ─── */
export default function WorkerProfile() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const { currentUser, userRole } = useAuth();

  const [worker, setWorker] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // If no id param, show the logged-in user's own profile
  const isOwnProfile = !id || (currentUser && id === currentUser.uid);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileId = id || currentUser?.uid;
        if (!profileId) { setLoading(false); return; }

        if (userRole === 'worker' || id) {
          // Try fetching worker document
          const { data: workerData, error: workerError } = await supabase.from('workers').select('*').eq('id', profileId).single();
          if (workerData) {
            setWorker(workerData);
            
            // Also fetch the user document to get the email and other user-level fields
            try {
              const { data: userData } = await supabase.from('users').select('*').eq('id', profileId).single();
              if (userData) {
                setUserDoc(userData);
              }
            } catch (err) {
              console.error('Error fetching user doc for worker:', err);
            }
            
            setLoading(false);
            return;
          }
        }

        // Fall back to users document for non-worker users
        const { data: userData } = await supabase.from('users').select('*').eq('id', profileId).single();
        if (userData) {
          setUserDoc(userData);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!loading || currentUser !== undefined) {
      fetchProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser, userRole]);

  const handleSaveWorkerProfile = async (data) => {
    const profileId = id || currentUser?.uid;
    const updatePayload = JSON.parse(JSON.stringify({
      name: data.name || '',
      categories: data.categories || [],
      avatar: data.avatar || '',
      bio: data.bio || '',
      phone: data.phone || '',
      locations: data.locations || [],
    }, (k, v) => v === undefined ? null : v));
    try {
      await supabase.from('workers').update({
        pendingUpdate: updatePayload
      }).eq('id', profileId);
      setWorker(prev => ({ ...prev, pendingUpdate: updatePayload }));
      setIsEditing(false);
      setSuccessMsg('Your profile updates have been submitted for admin approval.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      console.error("Firestore save worker profile error:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // No profile found and no query param either (guest or after logout)
  if (!worker && !userDoc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <IconUser className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Profile not found</h2>
        <p className="text-muted-foreground mt-2">
          {id ? 'The worker profile you are looking for does not exist.' : 'Please log in to view your profile.'}
        </p>
        {!id && (
          <Button asChild className="mt-6">
            <Link to="/login">Sign In</Link>
          </Button>
        )}
      </div>
    );
  }

  /* ── Worker profile view ── */
  if (worker) {
    const cats = Array.isArray(worker.categories) && worker.categories.length > 0
      ? worker.categories
      : worker.category ? [worker.category] : [];

    const canEdit = isOwnProfile && currentUser && (userRole === 'worker' || userRole === 'admin');

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link when viewing another worker's profile */}
        {id && !isOwnProfile && (
          <Link to="/workers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <IconArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>
        )}

        {/* Success toast */}
        {successMsg && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-100/10 border border-green-500/20 rounded-md flex items-center gap-2">
            <IconCheck className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Pending Update Banner */}
        {isOwnProfile && worker.pendingUpdate && (
          <div className="mb-4 p-3 text-sm text-amber-600 bg-amber-100/10 border border-amber-500/20 rounded-md flex items-center gap-2">
            <IconClock className="h-4 w-4 shrink-0" />
            You have a pending profile update waiting for admin approval. Making new changes will replace your pending update.
          </div>
        )}

        <Card className="border-border/40 overflow-hidden border shadow-lg bg-card">
          {/* Banner */}
          <div className="h-40 bg-gradient-to-r from-primary/25 via-primary/40 to-accent/20 relative">
            <Avatar className="h-28 w-28 absolute -bottom-14 left-8 border-4 border-background ring-4 ring-primary/20">
              <AvatarImage src={worker.avatar} alt={worker.name} />
              <AvatarFallback className="text-xl font-bold">{worker.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
          </div>

          <CardContent className="pt-18 pb-8 px-8 sm:px-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{worker.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {cats.map(cat => (
                    <Badge key={cat} variant="default" className="text-sm">
                      {t(`categories.${normalizeCategory(cat)}`, cat)}
                    </Badge>
                  ))}
                  {worker.status === 'pending' && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/40 bg-amber-500/10 text-xs">
                      Pending Review
                    </Badge>
                  )}
                  {worker.available ? (
                    <Badge variant="outline" className="text-green-500 border-green-500/40 bg-green-500/10 text-xs gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                      Active / Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-border bg-muted/20 text-xs gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                      Inactive / Unavailable
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconMapPin className="h-5 w-5 text-primary shrink-0" />
                  <span className="flex flex-wrap gap-1">
                    {Array.isArray(worker.locations) && worker.locations.length > 0 ? (
                      worker.locations.map((loc, idx) => (
                        <span key={idx}>
                          {loc.town}, {loc.district}{idx < worker.locations.length - 1 ? ' | ' : ''}
                        </span>
                      ))
                    ) : (
                      worker.location || 'Location not set'
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconPhone className="h-5 w-5 text-primary shrink-0" />
                  <span>{worker.phone || 'No phone number'}</span>
                </div>
                {canEdit && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2 mt-2 self-start"
                  >
                    <IconEdit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">About Me</h3>
              {isEditing && canEdit ? (
                <WorkerEditForm
                  worker={worker}
                  onSave={handleSaveWorkerProfile}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <p className="text-muted-foreground leading-relaxed">
                    {worker.bio || 'No bio provided yet.'}
                  </p>

                  <div className="mt-8 pt-8 border-t border-border/40">
                    <h3 className="text-lg font-semibold mb-4">Professional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Availability */}
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                        <IconClock className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Availability</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`h-2 w-2 rounded-full ${worker.available ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                            <span className="text-sm font-medium">
                              {worker.available ? 'Available / Active' : 'Unavailable / Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                        <IconPhone className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                          <p className="text-sm font-medium mt-0.5">{worker.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      {/* Email */}
                      {(userDoc?.email || (isOwnProfile && currentUser?.email)) && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                          <IconMail className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                            <p className="text-sm font-medium mt-0.5">{userDoc?.email || currentUser?.email}</p>
                          </div>
                        </div>
                      )}

                      {/* Joined Date */}
                      {worker.createdAt && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                          <IconCalendar className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Member Since</p>
                            <p className="text-sm font-medium mt-0.5">{getFormattedJoinedDate(worker.createdAt)}</p>
                          </div>
                        </div>
                      )}

                      {/* Service Locations */}
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40 md:col-span-2">
                        <IconMapPin className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Service Locations</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Array.isArray(worker.locations) && worker.locations.length > 0 ? (
                              worker.locations.map((loc, idx) => (
                                <Badge key={idx} variant="outline" className="bg-background/50 text-xs">
                                  {loc.town}, {loc.district}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="bg-background/50 text-xs">
                                {worker.location || 'Not specified'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Regular user (non-worker) profile view ── */
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {successMsg && (
        <div className="mb-4 p-3 text-sm text-green-600 bg-green-100/10 border border-green-500/20 rounded-md flex items-center gap-2">
          <IconCheck className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      <Card className="border-border/40 overflow-hidden border shadow-lg bg-card">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="h-24 w-24 rounded-2xl bg-primary/10 border-4 border-background ring-4 ring-primary/20 flex items-center justify-center">
              <IconUser className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>

        <CardContent className="pt-16 pb-8 px-8 sm:px-10">
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
            {userRole === 'admin' && (
              <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                <IconShieldCheck className="h-4 w-4" />
                <span>Administrator</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
              <IconMail className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium mt-0.5">{currentUser?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
              <IconPhone className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                <p className="text-sm font-medium mt-0.5">{userDoc?.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
              <IconUser className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Account Type</p>
                <p className="text-sm font-medium mt-0.5 capitalize">{userDoc?.role || 'User'}</p>
              </div>
            </div>

            {userRole === 'admin' && (
              <Button asChild className="w-full gap-2 mt-2">
                <Link to="/admin">
                  <IconShieldCheck className="h-4 w-4" />
                  Go to Admin Dashboard
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
