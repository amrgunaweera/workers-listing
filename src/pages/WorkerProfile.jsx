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
import { IconMapPin, IconPhone, IconEdit, IconCheck, IconX, IconUser, IconMail, IconArrowLeft, IconDashboard, IconAlertTriangle, IconClock, IconPlus, IconTrash, IconCalendar, IconStar } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { sriLankaLocations, allDistricts } from '../lib/locations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import SearchableSelect from '../components/SearchableSelect';
import SearchableMultiSelect from '../components/SearchableMultiSelect';
import ImageCropper from '../components/ImageCropper';

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

/* ─── Zod schema for worker profile edit ─── */
const editSchema = z.object({
  firstName: z.string().min(1, 'First Name is required.'),
  lastName: z.string().min(1, 'Last Name is required.'),
  email: z.string().email('Please enter a valid email.').or(z.literal('')).optional(),
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

const deleteAvatarFile = async (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.includes('/avatars/')) return;
  try {
    const parts = avatarUrl.split('/avatars/');
    let filePath = parts[parts.length - 1].split('?')[0]; // Remove query params if any
    filePath = decodeURIComponent(filePath); // Decode URL-encoded characters
    if (filePath.startsWith('/')) filePath = filePath.substring(1); // Ensure no leading slash
    if (filePath) {
      console.log('Attempting to delete avatar:', filePath);
      const { data, error } = await supabase.storage.from('avatars').remove([filePath]);
      if (error) {
        console.error('Supabase Storage Error:', error.message);
      } else if (!data || data.length === 0) {
        console.warn('Supabase Storage Warning: File was not deleted (possibly due to RLS policies or file not found). File:', filePath);
        alert(`Failed to delete avatar from storage.\n\nFile: ${filePath}\n\nThis is usually caused by missing DELETE permissions in Supabase Storage RLS policies. Please run the SQL command in Supabase to allow DELETE operations on the 'avatars' bucket.`);
      } else {
        console.log('Successfully deleted avatar from storage:', filePath);
      }
    }
  } catch (err) {
    console.error('Failed to parse/delete avatar from storage:', err);
  }
};

/* ─── Edit form for workers ─── */
function WorkerEditForm({ worker, onSave, onCancel }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [uploadedAvatars, setUploadedAvatars] = useState([]);

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
      firstName: worker.name ? worker.name.split(' ')[0] : '',
      lastName: worker.name ? worker.name.split(' ').slice(1).join(' ') : '',
      email: worker.email || '',
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

  const handleCancel = async () => {
    // Delete any avatars uploaded during this edit session
    for (const url of uploadedAvatars) {
      if (url !== worker.avatar) {
        await deleteAvatarFile(url);
      }
    }
    onCancel();
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setServerError('');
    try {
      // Delete any intermediate avatars uploaded during this session that are not the final selected one
      const finalAvatar = data.avatar;
      for (const url of uploadedAvatars) {
        if (url !== finalAvatar && url !== worker.avatar) {
          await deleteAvatarFile(url);
        }
      }

      const payload = { ...data };
      payload.name = `${payload.firstName.trim()} ${(payload.lastName || '').trim()}`.trim();
      delete payload.firstName;
      delete payload.lastName;

      await onSave(payload);
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
        <Label>Profile Picture</Label>
        <ImageCropper 
          currentAvatar={watch('avatar')}
          onCropDone={(url) => {
            setValue('avatar', url, { shouldValidate: true });
            setUploadedAvatars(prev => [...prev, url]);
          }}
        />
        {/* Keep hidden input for zod validation */}
        <input type="hidden" {...register('avatar')} />
        {errors.avatar && <p className="text-xs text-red-500">{errors.avatar.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ep-firstname">First Name</Label>
          <Input
            id="ep-firstname"
            placeholder="e.g. Kamal"
            className={`bg-background/50 ${errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('firstName')}
          />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ep-lastname">Last Name *</Label>
          <Input
            id="ep-lastname"
            placeholder="e.g. Perera"
            className={`bg-background/50 ${errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('lastName')}
          />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ep-phone">Phone *</Label>
          <Input
            id="ep-phone"
            placeholder="07X XXXXXXX"
            className={`bg-background/50 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('phone')}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ep-email">Email (Optional)</Label>
          <Input
            id="ep-email"
            type="email"
            placeholder="e.g. kamal@example.com"
            className={`bg-background/50 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Categories *</Label>
        <SearchableMultiSelect 
          options={categories}
          selected={watch('categories')} 
          onChange={(v) => setValue('categories', v, { shouldValidate: true })} 
          placeholder="Search and select categories..."
          renderOption={(opt) => t(`categories.${normalizeCategory(opt)}`, opt)}
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
                <SearchableSelect
                  options={allDistricts}
                  value={watch(`locations.${index}.district`)}
                  onChange={(val) => {
                    setValue(`locations.${index}.district`, val, { shouldValidate: true });
                    setValue(`locations.${index}.town`, '', { shouldValidate: true });
                  }}
                  placeholder="Select District"
                  error={errors.locations?.[index]?.district}
                />
                {errors.locations?.[index]?.district && (
                  <p className="text-xs text-red-500">{errors.locations[index].district.message}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <SearchableSelect
                  options={availableTowns}
                  value={watch(`locations.${index}.town`)}
                  onChange={(val) => setValue(`locations.${index}.town`, val, { shouldValidate: true })}
                  placeholder="Select Town"
                  disabled={!selectedDistrict}
                  error={errors.locations?.[index]?.town}
                />
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
        <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
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
  const [showPhone, setShowPhone] = useState(false);

  // If no id param, show the logged-in user's own profile
  const isOwnProfile = !id || (currentUser && id === currentUser.id);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileId = id || currentUser?.id;
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
    const profileId = id || currentUser?.id;
    const updatePayload = JSON.parse(JSON.stringify({
      name: data.name || '',
      email: data.email || '',
      categories: data.categories || [],
      avatar: data.avatar || '',
      bio: data.bio || '',
      phone: data.phone || '',
      locations: data.locations || [],
      // Also update the fallback category field just in case
      category: data.categories && data.categories.length > 0 ? data.categories[0] : 'Repairs Others'
    }, (k, v) => v === undefined ? null : v));

    try {
      // First, fetch the current worker to clean up unused avatars
      const { data: currentWorker } = await supabase.from('workers').select('avatar, pendingUpdate').eq('id', profileId).single();
      
      // If we are replacing the current active avatar, delete the old one
      if (currentWorker?.avatar && currentWorker.avatar !== data.avatar) {
        await deleteAvatarFile(currentWorker.avatar);
      }
      // If there was a pending avatar, also delete it since we're making updates direct now
      if (currentWorker?.pendingUpdate?.avatar && currentWorker.pendingUpdate.avatar !== data.avatar) {
        await deleteAvatarFile(currentWorker.pendingUpdate.avatar);
      }

      await supabase.from('workers').update({
        ...updatePayload,
        pendingUpdate: null // clear any pending update
      }).eq('id', profileId);
      
      setWorker(prev => ({ ...prev, ...updatePayload, pendingUpdate: null }));
      setIsEditing(false);
      setSuccessMsg('Your profile has been updated successfully.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      console.error("Save worker profile error:", error);
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



                      {/* Phone */}
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                        <IconPhone className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                          {worker.phone ? (
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-sm font-medium tracking-wider">
                                {showPhone ? worker.phone : worker.phone.slice(0, 3) + ' •••• ' + worker.phone.slice(-3)}
                              </p>
                              {!showPhone && (
                                <button
                                  onClick={() => setShowPhone(true)}
                                  className="text-xs font-semibold text-primary hover:underline cursor-pointer bg-primary/10 px-2 py-0.5 rounded"
                                >
                                  Show
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-medium mt-0.5 text-muted-foreground">Not provided</p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      {(worker.email || userDoc?.email || (isOwnProfile && currentUser?.email)) && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                          <IconMail className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                            <p className="text-sm font-medium mt-0.5">{worker.email || userDoc?.email || currentUser?.email}</p>
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
                <IconDashboard className="h-4 w-4" />
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
                  <IconDashboard className="h-4 w-4" />
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
