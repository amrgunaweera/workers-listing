import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { categories, normalizeCategory } from '../lib/categories';
import {
  IconTrash, IconEdit, IconCheck, IconX, IconLogout,
  IconUsers, IconBriefcase, IconSearch,
  IconPlus, IconRefresh, IconShieldCheck, IconAlertTriangle,
  IconMapPin, IconPhone, IconUser, IconClock, IconCheckbox
} from '@tabler/icons-react';

/* ─────────────────── helpers ─────────────────── */

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

/* ─────────────────── Worker Form Modal ─────────────────── */

function WorkerFormModal({ worker, onClose, onSave }) {
  const cats = workerCats(worker || {});
  const [form, setForm] = useState({
    name: worker?.name || '',
    categories: cats,
    locations: Array.isArray(worker?.locations) && worker.locations.length > 0 ? worker.locations : (worker?.location ? [{district: '', town: worker.location}] : []),
    location: worker?.location || '', // fallback legacy
    phone: worker?.phone || '',
    bio: worker?.bio || '',
    available: worker?.available ?? true,
    status: worker?.status || 'approved',
    avatar: worker?.avatar || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.categories.length === 0) { setError('Select at least one category.'); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        category: form.categories[0] || 'repairs-others', // legacy fallback
      });
    } catch {
      setError('Failed to save worker. Please try again.');
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted cursor-pointer">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <IconAlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="wf-name">Full Name *</Label>
            <Input id="wf-name" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Kamal Perera" required className="bg-background/50" />
          </div>

          <div className="space-y-1.5">
            <Label>Categories * <span className="text-muted-foreground font-normal text-xs">(select all that apply)</span></Label>
            <CategoryPicker selected={form.categories} onChange={v => handleChange('categories', v)} />
            {form.categories.length > 0 && (
              <p className="text-xs text-muted-foreground">Selected: {form.categories.join(', ')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wf-phone">Phone</Label>
            <Input id="wf-phone" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="07X XXXXXXX" className="bg-background/50" />
          </div>

          <div className="space-y-1.5">
            <Label>Locations (District & Town)</Label>
            {form.locations.map((loc, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={loc.district} onChange={e => { const newLocs = [...form.locations]; newLocs[idx].district = e.target.value; handleChange('locations', newLocs); }} placeholder="District" className="bg-background/50" />
                <Input value={loc.town} onChange={e => { const newLocs = [...form.locations]; newLocs[idx].town = e.target.value; handleChange('locations', newLocs); }} placeholder="Town" className="bg-background/50" />
                <Button type="button" variant="ghost" size="icon" onClick={() => { const newLocs = form.locations.filter((_, i) => i !== idx); handleChange('locations', newLocs); }} className="shrink-0">
                  <IconTrash className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => handleChange('locations', [...form.locations, { district: '', town: '' }])} className="w-full mt-2">
              <IconPlus className="w-4 h-4 mr-2" /> Add Location
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wf-bio">Bio / Description</Label>
            <textarea
              id="wf-bio"
              value={form.bio}
              onChange={e => handleChange('bio', e.target.value)}
              placeholder="A short description about this worker..."
              rows={3}
              className="w-full rounded-md border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.available ? 'active' : 'inactive'} onValueChange={v => handleChange('available', v === 'active')}>
                <SelectTrigger className="w-full bg-background/50 border-border/60 text-foreground">
                  <span data-slot="select-value" className="flex flex-1 text-left">{form.available ? 'Active' : 'Inactive'}</span>
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-avatar">Avatar URL</Label>
              <Input id="wf-avatar" value={form.avatar} onChange={e => handleChange('avatar', e.target.value)} placeholder="https://..." className="bg-background/50" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
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

/* ─────────────────── Main Dashboard ─────────────────── */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('workers'); // 'pending' | 'workers'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingWorker, setEditingWorker] = useState(null);
  const [reviewingUpdateWorker, setReviewingUpdateWorker] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

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

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('workers').select('*');
      if (error) throw error;
      setWorkers(data || []);
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const handleSaveWorker = async (formData) => {
    if (editingWorker) {
      const { error } = await supabase.from('workers').update(formData).eq('id', editingWorker.id);
      if (!error) {
        setWorkers(ws => ws.map(w => w.id === editingWorker.id ? { ...w, ...formData } : w));
        showToast('Worker updated successfully.');
        setEditingWorker(null);
      }
    } else {
      const newWorkerData = { ...formData, status: 'approved' };
      const { data, error } = await supabase.from('workers').insert([newWorkerData]).select().single();
      if (!error && data) {
        setWorkers(ws => [...ws, data]);
        showToast('Worker added successfully.');
        setShowAddModal(false);
      } else {
        console.error(error);
      }
    }
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
    await supabase.from('workers').update({ pendingUpdate: null }).eq('id', id);
    setWorkers(ws => ws.map(w => w.id === id ? { ...w, pendingUpdate: null } : w));
    showToast('Profile updates rejected.');
    setReviewingUpdateWorker(null);
  };

  const handleDeleteWorker = async () => {
    if (!deletingId) return;
    await supabase.from('workers').delete().eq('id', deletingId);
    setWorkers(ws => ws.filter(w => w.id !== deletingId));
    showToast('Worker deleted.');
    setDeletingId(null);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{currentUser?.email}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchWorkers} className="gap-2 cursor-pointer">
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
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
            ) : activeTab === 'pending' ? (
              <PendingWorkersTab workers={workers} onApprove={handleApprove} onReject={handleReject} onEdit={setEditingWorker} onReviewUpdate={setReviewingUpdateWorker} />
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
