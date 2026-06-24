import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { categories, normalizeCategory } from '../lib/categories';
import {
  IconTrash, IconEdit, IconCheck, IconX, IconLogout,
  IconUsers, IconBriefcase, IconSearch,
  IconPlus, IconRefresh, IconDashboard, IconAlertTriangle,
  IconMapPin, IconPhone, IconUser, IconClock, IconCheckbox
} from '@tabler/icons-react';
import SearchableSelect from '../components/SearchableSelect';
import ImageCropper from '../components/ImageCropper';
import { sriLankaLocations, allDistricts } from '../lib/locations';
import SearchableMultiSelect from '../components/SearchableMultiSelect';
import { Switch } from '../components/ui/switch';

/* ─────────────────── helpers ─────────────────── */

function generateUUID() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function workerCats(worker) {
  return Array.isArray(worker.categories) && worker.categories.length > 0
    ? worker.categories
    : worker.category ? [worker.category] : [];
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="border-border/40 bg-card shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────── Worker Form Modal ─────────────────── */

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

const workerSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Please enter a valid email.').or(z.literal('')).optional(),
  avatar: z.string().url('Must be a valid URL.').or(z.literal('')).optional(),
  categories: z.array(z.string()).min(1, 'Select at least one category.'),
  bio: z.string().max(500, 'Bio must be under 500 characters.').optional(),
  phone: z.string().min(1, 'Phone number is required.').regex(/^[0-9+\s\-()]{7,15}$/, 'Please enter a valid phone number.'),
  locations: z.array(
    z.object({
      district: z.string().min(1, 'District is required.'),
      town: z.string().min(1, 'Town is required.')
    })
  ).min(1, 'At least one location is required.'),
  available: z.boolean().default(true),
});

function WorkerFormModal({ worker, onClose, onSave }) {
  const cats = workerCats(worker || {});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [uploadedAvatars, setUploadedAvatars] = useState([]);

  let initialLocations = [{ district: '', town: '' }];
  if (Array.isArray(worker?.locations) && worker.locations.length > 0) {
    initialLocations = worker.locations;
  } else if (worker?.location && worker.location !== 'Not specified') {
    initialLocations = [{ district: '', town: worker.location }];
  }

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      firstName: worker?.name ? worker.name.split(' ')[0] : '',
      lastName: worker?.name ? worker.name.split(' ').slice(1).join(' ') : '',
      email: worker?.email || '',
      avatar: worker?.avatar || '',
      categories: cats,
      bio: worker?.bio || '',
      phone: worker?.phone || '',
      locations: initialLocations,
      available: worker?.available ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'locations',
  });

  const handleClose = async () => {
    // Delete any avatars uploaded during this modal session
    for (const url of uploadedAvatars) {
      if (url !== worker?.avatar) {
        await deleteAvatarFile(url);
      }
    }
    onClose();
  };

  const onSubmit = async (data) => {
    setServerError('');
    setSaving(true);
    try {
      // Delete any intermediate avatars uploaded during this session that are not the final selected one
      const finalAvatar = data.avatar;
      for (const url of uploadedAvatars) {
        if (url !== finalAvatar && url !== worker?.avatar) {
          await deleteAvatarFile(url);
        }
      }

      const payload = { ...data };
      payload.name = `${data.firstName.trim()} ${data.lastName?.trim() || ''}`.trim();
      delete payload.firstName;
      delete payload.lastName;

      await onSave({
        ...payload,
        category: data.categories[0] || 'Repairs Others', // legacy fallback
      });
    } catch (err) {
      setServerError(err?.message || 'Failed to save worker. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            {worker ? 'Edit Worker' : 'Add New Worker'}
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted cursor-pointer">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto" noValidate>
          {serverError && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <IconAlertTriangle className="w-4 h-4 shrink-0" />
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Profile Picture</Label>
            <ImageCropper 
              currentAvatar={watch('avatar')}
              onCropDone={(url) => {
                setValue('avatar', url, { shouldValidate: true });
                setUploadedAvatars(prev => [...prev, url]);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wf-firstname">First Name *</Label>
              <Input id="wf-firstname" placeholder="e.g. Kamal" className={`bg-background/50 ${errors.firstName ? 'border-red-500' : ''}`} {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-lastname">Last Name *</Label>
              <Input id="wf-lastname" placeholder="e.g. Perera" className={`bg-background/50 ${errors.lastName ? 'border-red-500' : ''}`} {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categories *</Label>
            <SearchableMultiSelect 
              options={categories} 
              selected={watch('categories')} 
              onChange={v => setValue('categories', v, { shouldValidate: true })} 
              placeholder="Search and select categories..." 
              error={errors.categories?.message}
            />
            {errors.categories && <p className="text-xs text-red-500">{errors.categories.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wf-phone">Phone *</Label>
              <Input id="wf-phone" placeholder="07X XXXXXXX" className={`bg-background/50 ${errors.phone ? 'border-red-500' : ''}`} {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-email">Email (Optional)</Label>
              <Input id="wf-email" type="email" placeholder="e.g. kamal@example.com" className={`bg-background/50 ${errors.email ? 'border-red-500' : ''}`} {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Locations (District & Town) *</Label>
            {fields.map((loc, idx) => {
              const currentDistrict = watch(`locations.${idx}.district`);
              const availableTowns = currentDistrict && sriLankaLocations[currentDistrict] ? sriLankaLocations[currentDistrict] : [];
              return (
                <div key={loc.id} className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <SearchableSelect
                      options={allDistricts}
                      value={currentDistrict}
                      onChange={(val) => {
                        setValue(`locations.${idx}.district`, val, { shouldValidate: true });
                        setValue(`locations.${idx}.town`, '', { shouldValidate: true });
                      }}
                      placeholder="Select District"
                    />
                    {errors.locations?.[idx]?.district && <p className="text-xs text-red-500">{errors.locations[idx].district.message}</p>}
                  </div>
                  <div className="flex-1 space-y-1">
                    <SearchableSelect
                      options={availableTowns}
                      value={watch(`locations.${idx}.town`)}
                      onChange={(val) => {
                        setValue(`locations.${idx}.town`, val, { shouldValidate: true });
                      }}
                      placeholder="Select Town"
                      disabled={!currentDistrict}
                    />
                    {errors.locations?.[idx]?.town && <p className="text-xs text-red-500">{errors.locations[idx].town.message}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} className="shrink-0" disabled={fields.length === 1}>
                    <IconTrash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ district: '', town: '' })} className="w-full mt-2">
              <IconPlus className="w-4 h-4 mr-2" /> Add Location
            </Button>
            {errors.locations?.root && <p className="text-xs text-red-500">{errors.locations.root.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wf-bio">Bio / Description</Label>
            <textarea
              id="wf-bio"
              {...register('bio')}
              placeholder="A short description about this worker..."
              rows={3}
              className={`w-full rounded-md border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.bio ? 'border-red-500' : 'border-border/60'}`}
            />
            {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/30 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="available-switch" className="text-sm font-semibold text-foreground">Active Status</Label>
              <p className="text-xs text-muted-foreground">
                {watch('available') ? 'Worker is active and visible on the platform' : 'Worker is inactive and hidden from the platform'}
              </p>
            </div>
            <Switch
              id="available-switch"
              checked={watch('available')}
              onCheckedChange={(val) => setValue('available', val, { shouldValidate: true })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : worker ? 'Save Changes' : 'Add Worker'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────── Review Update Modal ─────────────────── */

function ReviewUpdateModal({ worker, onClose, onApproveUpdate, onRejectUpdate }) {
  if (!worker || !worker.pendingUpdate) return null;
  const curr = worker;
  const upd = worker.pendingUpdate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold tracking-tight">Review Profile Update</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted cursor-pointer">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
           <div className="grid grid-cols-2 gap-6">
             {/* Current vs New */}
             <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-2">Current Public Profile</h3>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Name</p>
                  <p className="text-sm bg-muted/30 p-2 rounded mt-1">{curr.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Categories</p>
                  <p className="text-sm bg-muted/30 p-2 rounded mt-1">{Array.isArray(curr.categories) && curr.categories.length > 0 ? curr.categories.join(', ') : (curr.category || '—')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Avatar URL</p>
                  <p className="text-sm bg-muted/30 p-2 rounded mt-1 truncate">{curr.avatar || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Bio</p>
                  <p className="text-sm bg-muted/30 p-2 rounded mt-1 min-h-[60px] whitespace-pre-wrap">{curr.bio || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Phone</p>
                  <p className="text-sm bg-muted/30 p-2 rounded mt-1">{curr.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Locations</p>
                  <p className="text-sm bg-muted/30 p-2 rounded mt-1">
                    {Array.isArray(curr.locations) && curr.locations.length > 0 
                      ? curr.locations.map(l => `${l.town}, ${l.district}`).join(' | ') 
                      : (curr.location || '—')}
                  </p>
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="font-semibold text-sm text-amber-600 uppercase tracking-wider border-b border-amber-200 dark:border-amber-900 pb-2">Proposed Updates</h3>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Name</p>
                  <p className={`text-sm p-2 rounded mt-1 ${upd.name && upd.name !== curr.name ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-muted/30'}`}>{upd.name || curr.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Categories</p>
                  <p className={`text-sm p-2 rounded mt-1 ${upd.categories && JSON.stringify(upd.categories) !== JSON.stringify(Array.isArray(curr.categories) && curr.categories.length > 0 ? curr.categories : (curr.category ? [curr.category] : [])) ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-muted/30'}`}>
                    {upd.categories ? upd.categories.join(', ') : (Array.isArray(curr.categories) && curr.categories.length > 0 ? curr.categories.join(', ') : (curr.category || '—'))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Avatar URL</p>
                  <p className={`text-sm p-2 rounded mt-1 truncate ${upd.avatar !== undefined && upd.avatar !== curr.avatar ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-muted/30'}`}>{upd.avatar !== undefined ? (upd.avatar || '—') : (curr.avatar || '—')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Bio</p>
                  <p className={`text-sm p-2 rounded mt-1 min-h-[60px] whitespace-pre-wrap ${upd.bio !== curr.bio ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-muted/30'}`}>{upd.bio || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Phone</p>
                  <p className={`text-sm p-2 rounded mt-1 ${upd.phone !== curr.phone ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-muted/30'}`}>{upd.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Locations</p>
                  <p className={`text-sm p-2 rounded mt-1 ${JSON.stringify(upd.locations) !== JSON.stringify(curr.locations) ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-muted/30'}`}>
                    {Array.isArray(upd.locations) && upd.locations.length > 0 
                      ? upd.locations.map(l => `${l.town}, ${l.district}`).join(' | ') 
                      : (upd.location || '—')}
                  </p>
                </div>
             </div>
           </div>
           
           <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
             <Button variant="outline" onClick={onClose}>Cancel</Button>
             <Button variant="destructive" onClick={() => onRejectUpdate(worker.id)} className="gap-1.5 cursor-pointer">
               <IconX className="w-4 h-4"/>Reject Update
             </Button>
             <Button variant="success" onClick={() => onApproveUpdate(worker)} className="gap-1.5 cursor-pointer">
               <IconCheck className="w-4 h-4"/>Approve Update
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Confirm Dialog ─────────────────── */

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-150 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <IconAlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Worker Row ─────────────────── */

function WorkerRow({ worker, onEdit, onDelete, onToggle }) {
  const cats = workerCats(worker);
  const isPending = worker.status === 'pending';
  return (
    <TableRow className="border-border/30 hover:bg-muted/30 transition-colors">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          {worker.avatar ? (
            <img src={worker.avatar} alt={worker.name} className="h-9 w-9 rounded-full object-cover border border-border/40" onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-border/40">
              <span className="text-xs font-bold text-primary">{(worker.name || '?').substring(0, 2).toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">{worker.name}</p>
            {isPending && (
              <span className="text-[10px] text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded-full">Pending review</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {cats.length > 0 ? cats.map(c => (
            <Badge key={c} variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary font-medium">{c}</Badge>
          )) : <span className="text-muted-foreground text-xs">—</span>}
        </div>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <IconMapPin className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[150px]" title={Array.isArray(worker.locations) && worker.locations.length > 0 ? worker.locations.map(l => l.town).join(', ') : worker.location}>
            {Array.isArray(worker.locations) && worker.locations.length > 0 
              ? worker.locations.map(l => l.town).join(', ') 
              : (worker.location || '—')}
          </span>
        </span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <IconPhone className="w-3 h-3 shrink-0" />{worker.phone || '—'}
        </span>
      </TableCell>

      <TableCell>
        <button onClick={() => onToggle(worker)} className="cursor-pointer" title="Click to toggle status">
          {worker.available ? (
            <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full hover:bg-green-500/20 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full hover:bg-red-500/20 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Inactive
            </span>
          )}
        </button>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer" onClick={() => onEdit(worker)} title="Edit">
            <IconEdit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer" onClick={() => onDelete(worker.id)} title="Delete">
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ─────────────────── Pending Workers Tab ─────────────────── */

function PendingWorkersTab({ workers, onApprove, onReject, onEdit, onReviewUpdate }) {
  const pending = workers.filter(w => w.status === 'pending' || w.pendingUpdate || (!w.available && w.status !== 'rejected'));
  if (pending.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <IconCheckbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No pending approvals</p>
        <p className="text-sm">All workers have been reviewed.</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border/30">
      {pending.map(worker => {
        const cats = workerCats(worker);
        return (
          <div key={worker.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              {worker.avatar ? (
                <img src={worker.avatar} alt={worker.name} className="h-11 w-11 rounded-full object-cover border-2 border-amber-500/30" onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="h-11 w-11 rounded-full bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/20">
                  <span className="text-sm font-bold text-amber-600">{(worker.name || '?').substring(0, 2).toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {worker.name}
                  {worker.pendingUpdate && <span className="ml-2 text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium border border-amber-500/20">Profile Update</span>}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cats.length > 0 ? cats.map(c => (
                    <span key={c} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{c}</span>
                  )) : <span className="text-xs text-muted-foreground">No category assigned</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {worker.phone && <span className="flex items-center gap-1"><IconPhone className="w-3 h-3" />{worker.phone}</span>}
                  {(Array.isArray(worker.locations) && worker.locations.length > 0 || (worker.location && worker.location !== 'Not specified')) && (
                    <span className="flex items-center gap-1"><IconMapPin className="w-3 h-3" />
                      {Array.isArray(worker.locations) && worker.locations.length > 0 ? worker.locations.map(l => l.town).join(', ') : worker.location}
                    </span>
                  )}
                </div>
                {worker.createdAt && <p className="text-[10px] text-muted-foreground/60 mt-0.5">Registered: {new Date(worker.createdAt).toLocaleDateString()}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {worker.pendingUpdate ? (
                <Button size="sm" variant="outline" onClick={() => onReviewUpdate(worker)} className="gap-1.5 text-xs cursor-pointer border-amber-500 text-amber-600 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-950/30">
                  <IconAlertTriangle className="w-3.5 h-3.5" />Review Update
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => onEdit(worker)} className="gap-1.5 text-xs cursor-pointer">
                    <IconEdit className="w-3.5 h-3.5" />Edit & Assign
                  </Button>
                  <Button size="sm" variant="success" onClick={() => onApprove(worker)} className="gap-1.5 text-xs cursor-pointer">
                    <IconCheck className="w-3.5 h-3.5" />Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onReject(worker.id)} className="gap-1.5 text-xs cursor-pointer">
                    <IconX className="w-3.5 h-3.5" />Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
/* ─────────────────── Admin Management Components ─────────────────── */

const adminSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email.'),
  phone: z.string().min(1, 'Phone number is required.').regex(/^[0-9+\s\-()]{7,15}$/, 'Please enter a valid phone number.'),
});

function AdminFormModal({ onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
      phone: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSaving(true);
    try {
      await onSave(data);
    } catch (err) {
      setServerError(err?.message || 'Failed to save admin. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Add New Admin</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted cursor-pointer">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          {serverError && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <IconAlertTriangle className="w-4 h-4 shrink-0" />
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="admin-phone">Phone *</Label>
            <Input id="admin-phone" placeholder="07X XXXXXXX" className={`bg-background/50 ${errors.phone ? 'border-red-500' : ''}`} {...register('phone')} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email *</Label>
            <Input id="admin-email" type="email" placeholder="e.g. admin@example.com" className={`bg-background/50 ${errors.email ? 'border-red-500' : ''}`} {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Admin'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminRow({ admin, onDelete, currentUserId }) {
  return (
    <TableRow className="border-border/30 hover:bg-muted/30 transition-colors">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-border/40">
            <IconUser className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{admin.email || admin.phone}</p>
            {admin.id === currentUserId && (
              <span className="text-[10px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">You</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <IconPhone className="w-3 h-3 shrink-0" />{admin.phone || '—'}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {new Date(admin.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        {admin.id !== currentUserId && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer" onClick={() => onDelete(admin.id)} title="Delete Admin">
            <IconTrash className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

/* ─────────────────── Main Dashboard ─────────────────── */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('workers'); // 'pending' | 'workers' | 'admins'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingWorker, setEditingWorker] = useState(null);
  const [reviewingUpdateWorker, setReviewingUpdateWorker] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [newWorkerCredentials, setNewWorkerCredentials] = useState(null);

  const supabaseAdmin = useMemo(() => {
    return createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }, []);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, adminsRes] = await Promise.all([
        supabase.from('workers').select('*'),
        supabase.from('users').select('*').eq('role', 'admin')
      ]);
      if (workersRes.error) throw workersRes.error;
      if (adminsRes.error) throw adminsRes.error;
      setWorkers(workersRes.data || []);
      setAdmins(adminsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const handleSaveWorker = async (formData) => {
    if (editingWorker) {
      if (formData.avatar && formData.avatar !== editingWorker.avatar) {
        await deleteAvatarFile(editingWorker.avatar);
      }
      if (editingWorker.pendingUpdate?.avatar && 
          editingWorker.pendingUpdate.avatar !== editingWorker.avatar && 
          editingWorker.pendingUpdate.avatar !== formData.avatar) {
        await deleteAvatarFile(editingWorker.pendingUpdate.avatar);
      }

      const updateData = {
        ...formData,
        pendingUpdate: null
      };

      const { error } = await supabase.from('workers').update(updateData).eq('id', editingWorker.id);
      if (!error) {
        setWorkers(ws => ws.map(w => w.id === editingWorker.id ? { ...w, ...updateData } : w));
        showToast('Worker updated successfully.');
        setEditingWorker(null);
      } else {
        console.error(error);
        throw error;
      }
    } else {
      const initialPassword = Math.random().toString(36).slice(-8); // Generate 8-char random password
      const registerEmail = formData.email?.trim() || `worker-${formData.phone.trim()}@bestservicelk.com`;

      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: registerEmail,
        password: initialPassword,
        options: {
          data: {
            requires_password_change: true
          }
        }
      });

      if (authError) {
        console.error("Auth creation error:", authError);
        throw authError;
      }

      const user = authData.user;
      if (!user) throw new Error("Failed to create auth user");

      const newId = user.id;

      // Create user record
      const { error: userError } = await supabase.from('users').insert([{
        id: newId,
        email: user.email,
        phone: formData.phone?.trim() || null,
        role: 'worker',
        createdAt: new Date().toISOString(),
      }]);

      if (userError) {
        console.error("User record creation error:", userError);
        throw userError;
      }

      const newWorkerData = {
        ...formData,
        id: newId,
        userId: newId,
        status: 'approved',
        rating: 5.0,
        createdAt: new Date().toISOString()
      };
      
      const { data: workerData, error: workerError } = await supabase.from('workers').insert([newWorkerData]).select().single();
      
      if (!workerError && workerData) {
        setWorkers(ws => [...ws, workerData]);
        showToast('Worker added successfully.');
        setShowAddModal(false);
        setNewWorkerCredentials({
          emailOrPhone: formData.email || formData.phone,
          password: initialPassword
        });
      } else {
        console.error("Worker record creation error:", workerError);
        throw workerError;
      }
    }
  };

  const handleSaveAdmin = async (formData) => {
    const initialPassword = Math.random().toString(36).slice(-8); // Generate 8-char random password
    const registerEmail = formData.email?.trim() || `admin-${formData.phone?.trim()}@bestservicelk.com`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: registerEmail,
      password: initialPassword,
      options: {
        data: {
          requires_password_change: true
        }
      }
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      throw authError;
    }

    const user = authData.user;
    if (!user) throw new Error("Failed to create auth user");

    const newId = user.id;

    // Create user record
    const newAdmin = {
      id: newId,
      email: user.email,
      phone: formData.phone?.trim() || null,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    const { error: userError } = await supabase.from('users').insert([newAdmin]);

    if (userError) {
      console.error("User record creation error:", userError);
      throw userError;
    }

    setAdmins(ads => [...ads, newAdmin]);
    showToast('Admin added successfully.');
    setShowAddAdminModal(false);
    setNewWorkerCredentials({
      emailOrPhone: formData.email || formData.phone,
      password: initialPassword
    });
  };

  const handleApprove = async (worker) => {
    const update = { available: true, status: 'approved' };
    await supabase.from('workers').update(update).eq('id', worker.id);
    setWorkers(ws => ws.map(w => w.id === worker.id ? { ...w, ...update } : w));
    showToast(`${worker.name} has been approved and is now active.`);
  };

  const handleReject = async (id) => {
    const update = { available: false, status: 'rejected' };
    await supabase.from('workers').update(update).eq('id', id);
    setWorkers(ws => ws.map(w => w.id === id ? { ...w, ...update } : w));
    showToast('Worker rejected.');
  };

  const handleApproveUpdate = async (worker) => {
    if (worker.pendingUpdate.avatar && worker.pendingUpdate.avatar !== worker.avatar) {
      await deleteAvatarFile(worker.avatar);
    }
    const update = {
      ...worker.pendingUpdate,
      pendingUpdate: null
    };
    await supabase.from('workers').update(update).eq('id', worker.id);
    setWorkers(ws => ws.map(w => w.id === worker.id ? { ...w, ...worker.pendingUpdate, pendingUpdate: null } : w));
    showToast(`${worker.name}'s profile updates have been approved.`);
    setReviewingUpdateWorker(null);
  };

  const handleRejectUpdate = async (id) => {
    const worker = workers.find(w => w.id === id);
    if (worker?.pendingUpdate?.avatar && worker.pendingUpdate.avatar !== worker.avatar) {
      await deleteAvatarFile(worker.pendingUpdate.avatar);
    }
    await supabase.from('workers').update({ pendingUpdate: null }).eq('id', id);
    setWorkers(ws => ws.map(w => w.id === id ? { ...w, pendingUpdate: null } : w));
    showToast('Profile updates rejected.');
    setReviewingUpdateWorker(null);
  };

  const handleDeleteWorker = async () => {
    if (!deletingId) return;

    // Delete avatar from storage if it exists
    const workerToDelete = workers.find(w => w.id === deletingId);
    if (workerToDelete) {
      await deleteAvatarFile(workerToDelete.avatar);
      if (workerToDelete.pendingUpdate?.avatar && workerToDelete.pendingUpdate.avatar !== workerToDelete.avatar) {
        await deleteAvatarFile(workerToDelete.pendingUpdate.avatar);
      }
    }

    await supabase.from('workers').delete().eq('id', deletingId);
    await supabase.from('users').delete().eq('id', deletingId);
    setWorkers(ws => ws.filter(w => w.id !== deletingId));
    showToast('Worker deleted.');
    setDeletingId(null);
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdminId) return;
    if (deletingAdminId === currentUser?.id) {
      showToast('You cannot delete yourself.');
      setDeletingAdminId(null);
      return;
    }

    await supabase.from('users').delete().eq('id', deletingAdminId);
    setAdmins(ads => ads.filter(a => a.id !== deletingAdminId));
    showToast('Admin deleted.');
    setDeletingAdminId(null);
  };

  const handleToggleAvailability = async (worker) => {
    const updated = !worker.available;
    const statusUpdate = updated ? 'approved' : 'inactive';
    await supabase.from('workers').update({ available: updated, status: statusUpdate }).eq('id', worker.id);
    setWorkers(ws => ws.map(w => w.id === worker.id ? { ...w, available: updated, status: statusUpdate } : w));
    showToast(`Worker marked as ${updated ? 'Active' : 'Inactive'}.`);
  };

  const pendingCount = useMemo(() =>
    workers.filter(w => w.status === 'pending' || w.pendingUpdate || (!w.available && w.status !== 'rejected' && w.status !== 'inactive')).length,
    [workers]);

  const approvedWorkers = useMemo(() =>
    workers.filter(w => w.status === 'approved' || (w.available && w.status !== 'pending')),
    [workers]);

  const filteredWorkers = useMemo(() => {
    return approvedWorkers.filter(w => {
      const q = search.toLowerCase();
      const cats = workerCats(w);
      const catText = cats.join(' ').toLowerCase();
      const locTextMatch = Array.isArray(w.locations) && w.locations.length > 0
        ? w.locations.some(l => l.district.toLowerCase().includes(q) || l.town.toLowerCase().includes(q))
        : (w.location || '').toLowerCase().includes(q);
      const matchSearch = !q || (w.name || '').toLowerCase().includes(q) || locTextMatch || (w.phone || '').toLowerCase().includes(q) || catText.includes(q);
      const matchCat = !categoryFilter || cats.some(c => normalizeCategory(c) === categoryFilter);
      const matchStatus = !statusFilter || (statusFilter === 'active' ? w.available : !w.available);
      return matchSearch && matchCat && matchStatus;
    });
  }, [approvedWorkers, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: workers.length,
    active: workers.filter(w => w.available).length,
    pending: pendingCount,
  }), [workers, pendingCount]);

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-[100] bg-zinc-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl border border-zinc-700 animate-in slide-in-from-right-4 duration-300 flex items-center gap-2">
          <IconCheck className="w-4 h-4 text-green-400" />{toastMsg}
        </div>
      )}

      {newWorkerCredentials && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 p-6">
            <h3 className="text-lg font-bold mb-4 text-center">Worker Created Successfully!</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Please share these initial credentials with the worker. They will be forced to change their password upon first login.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3 mb-6">
              <div>
                <Label className="text-xs text-muted-foreground">Login (Email or Phone)</Label>
                <div className="font-medium text-foreground">{newWorkerCredentials.emailOrPhone}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Initial Password</Label>
                <div className="font-mono text-foreground tracking-wider">{newWorkerCredentials.password}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                variant="default" 
                onClick={() => {
                  const text = `Welcome to BestService! Your account has been created.\nLogin: ${newWorkerCredentials.emailOrPhone}\nPassword: ${newWorkerCredentials.password}\nPlease log in to change your password and start using the platform.`;
                  navigator.clipboard.writeText(text);
                  showToast('Credentials copied to clipboard!');
                }}
              >
                Copy Credentials
              </Button>
              <Button variant="outline" onClick={() => setNewWorkerCredentials(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <ConfirmDialog title="Delete Worker" message="This action is permanent and cannot be undone." onConfirm={handleDeleteWorker} onCancel={() => setDeletingId(null)} />
      )}

      {reviewingUpdateWorker && (
        <ReviewUpdateModal 
          worker={reviewingUpdateWorker} 
          onClose={() => setReviewingUpdateWorker(null)} 
          onApproveUpdate={handleApproveUpdate} 
          onRejectUpdate={handleRejectUpdate} 
        />
      )}

      {(editingWorker || showAddModal) && (
        <WorkerFormModal worker={editingWorker || null} onClose={() => { setEditingWorker(null); setShowAddModal(false); }} onSave={handleSaveWorker} />
      )}

      {showAddAdminModal && (
        <AdminFormModal onClose={() => setShowAddAdminModal(false)} onSave={handleSaveAdmin} />
      )}

      {deletingAdminId && (
        <ConfirmDialog title="Delete Admin" message="This action is permanent and cannot be undone." onConfirm={handleDeleteAdmin} onCancel={() => setDeletingAdminId(null)} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{currentUser?.email}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 cursor-pointer">
              <IconRefresh className="w-4 h-4" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={IconUsers} label="Total Workers" value={stats.total} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={IconCheck} label="Active" value={stats.active} color="bg-green-500/10 text-green-500" />
          <StatCard icon={IconClock} label="Pending Approval" value={stats.pending} color="bg-amber-500/10 text-amber-500" />
        </div>

        {/* Single Card containing both Tabs */}
        <Card className="border-border/40 bg-card overflow-hidden shadow-sm">
          <CardHeader className="px-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-0">
              <div className="flex gap-6 -mb-[1px]">
                <button
                  onClick={() => setActiveTab('workers')}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2 ${activeTab === 'workers'
                    ? 'border-primary text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60'
                    }`}
                >
                  All Workers
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2 ${activeTab === 'pending'
                    ? 'border-primary text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60'
                    }`}
                >
                  Pending Approval
                  {pendingCount > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center justify-center px-1.5 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2 ${activeTab === 'admins'
                    ? 'border-primary text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60'
                    }`}
                >
                  Admins
                </button>
              </div>
            </div>

            {activeTab === 'workers' && (
              <div className="flex flex-col sm:flex-row gap-3 mt-3 items-stretch sm:items-center">
                <div className="relative w-full sm:w-72">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                  <Input placeholder="Search by name, location, phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs bg-background/50 border-border/60" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs w-full sm:w-44 bg-background/50 border-border/60 text-foreground">
                    <span data-slot="select-value" className="flex flex-1 text-left">{categoryFilter || <span className="text-muted-foreground">All categories</span>}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground max-h-60">
                    <SelectItem value="" className="text-xs">All categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-full sm:w-32 bg-background/50 border-border/60 text-foreground">
                    <span data-slot="select-value" className="flex flex-1 text-left">
                      {statusFilter === 'active' ? 'Active' : statusFilter === 'inactive' ? 'Inactive' : <span className="text-muted-foreground">All status</span>}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="" className="text-xs">All status</SelectItem>
                    <SelectItem value="active" className="text-xs">Active</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowAddModal(true)} className="gap-2 cursor-pointer w-full sm:w-auto sm:ml-auto h-8 text-xs">
                  <IconPlus className="w-4 h-4" />Add Worker
                </Button>
              </div>
            )}

            {activeTab === 'admins' && (
              <div className="flex justify-end mt-3">
                <Button onClick={() => setShowAddAdminModal(true)} className="gap-2 cursor-pointer h-8 text-xs">
                  <IconPlus className="w-4 h-4" />Add Admin
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
            ) : activeTab === 'pending' ? (
              <PendingWorkersTab workers={workers} onApprove={handleApprove} onReject={handleReject} onEdit={setEditingWorker} onReviewUpdate={setReviewingUpdateWorker} />
            ) : activeTab === 'admins' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-muted/10 hover:bg-muted/10">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Admin</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Phone</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Created At</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map(admin => (
                      <AdminRow key={admin.id} admin={admin} onDelete={setDeletingAdminId} currentUserId={currentUser?.id} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <IconUser className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No workers found</p>
                <p className="text-sm">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-muted/10 hover:bg-muted/10">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Worker</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Categories</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Location</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Phone</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers.map(worker => (
                      <WorkerRow key={worker.id} worker={worker} onEdit={setEditingWorker} onDelete={setDeletingId} onToggle={handleToggleAvailability} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
