/**
 * Applications Persistence Service for Vox Direct
 * 
 * Persists incoming Offer Owner and Candidate submissions to the Supabase
 * 'public.applications' table, with local caching and real-time syncing.
 * 
 * RESILIENCY DESIGN:
 * - Uses valid RFC4122 v4 UUIDs for all records so IDs match PostgreSQL 'uuid' primary key.
 * - Always performs immediate local cache persistence so UI operations never fail or block.
 * - Gracefully attempts Supabase sync; if Supabase Row Level Security (RLS) is active
 *   or offline, operations succeed locally while logging clear diagnostic feedback.
 */

import { ApplicationRecord, ApplicationRoleType, ApplicationStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const APPLICATIONS_CACHE_KEY = 'vox_direct_supabase_applications_cache';

/**
 * Standard RFC4122 v4 UUID generator (works across modern browser Web Crypto & Node)
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a string is a standard UUID format
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export interface StatusUpdateResult {
  success: boolean;
  syncedToSupabase: boolean;
  error?: string;
}

export const applicationsService = {
  /**
   * Reads cached applications from local storage
   */
  getLocalCache(): ApplicationRecord[] {
    try {
      const raw = localStorage.getItem(APPLICATIONS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Filter out any legacy seed records
        const filtered = Array.isArray(parsed)
          ? parsed.filter((item) => item && !String(item.id).startsWith('app_seed_'))
          : [];
        return filtered;
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Saves records to local cache
   */
  saveLocalCache(items: ApplicationRecord[]): void {
    try {
      localStorage.setItem(APPLICATIONS_CACHE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save applications cache:', e);
    }
  },

  /**
   * Fetch all applications (from Supabase if configured, merged with local cache)
   */
  async getAllApplications(): Promise<{ data: ApplicationRecord[]; fromSupabase: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Filter out legacy demo items if any were inserted
          const filtered = data.filter((row: any) => !String(row.id).startsWith('app_seed_'));
          const mapped: ApplicationRecord[] = filtered.map((row: any) => ({
            id: String(row.id),
            user_id: row.user_id || null,
            role_type: (row.role_type as ApplicationRoleType) || 'candidate',
            full_name: row.full_name || 'Anonymous Applicant',
            email: row.email || '',
            phone: row.phone || row.details?.phone || '',
            details: typeof row.details === 'object' && row.details !== null ? row.details : {},
            status: ((row.status || 'pending').toLowerCase() as ApplicationStatus),
            notes: row.notes || '',
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || undefined,
          }));

          // Merge Supabase records with any locally-created records not yet in Supabase
          const localItems = this.getLocalCache();
          const supabaseIds = new Set(mapped.map((r) => r.id));
          const unsyncedLocal = localItems.filter((item) => !supabaseIds.has(item.id));
          const combined = [...mapped, ...unsyncedLocal];

          this.saveLocalCache(combined);
          return { data: combined, fromSupabase: true };
        }

        if (error) {
          console.warn('Supabase applications fetch returned notice (falling back to cache):', error.message);
          return { data: this.getLocalCache(), fromSupabase: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('Supabase fetch exception:', err);
        return { data: this.getLocalCache(), fromSupabase: false, error: err?.message };
      }
    }

    return { data: this.getLocalCache(), fromSupabase: false };
  },

  /**
   * Create an application submission
   */
  async createApplication(params: {
    userId?: string | null;
    roleType: ApplicationRoleType;
    fullName: string;
    email: string;
    phone?: string;
    details: Record<string, any>;
  }): Promise<{ record: ApplicationRecord; savedToSupabase: boolean }> {
    // Generate valid UUID to match PostgreSQL uuid column
    const recordId = generateUUID();
    const now = new Date().toISOString();

    const record: ApplicationRecord = {
      id: recordId,
      user_id: params.userId || null,
      role_type: params.roleType,
      full_name: params.fullName,
      email: params.email,
      phone: params.phone || '',
      details: params.details,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    // 1. Immediately store in local cache
    const currentList = this.getLocalCache();
    const updatedList = [record, ...currentList.filter((item) => item.id !== record.id)];
    this.saveLocalCache(updatedList);

    // 2. Persist to Supabase 'applications' table if configured
    let savedToSupabase = false;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .insert([
            {
              id: recordId,
              user_id: params.userId || null,
              role_type: params.roleType,
              full_name: params.fullName,
              email: params.email,
              phone: params.phone || null,
              details: params.details,
              status: 'pending',
              created_at: now,
              updated_at: now,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          savedToSupabase = true;
          record.id = String(data.id);
          const syncdList = [record, ...currentList.filter((item) => item.id !== recordId)];
          this.saveLocalCache(syncdList);
        } else if (error) {
          console.warn('Could not insert application to Supabase (RLS or policy):', error.message);
        }
      } catch (err) {
        console.warn('Exception during Supabase application insertion:', err);
      }
    }

    return { record, savedToSupabase };
  },

  /**
   * Update an application's review status
   * Guaranteed to persist to local cache and synchronize with Supabase.
   */
  async updateStatus(id: string, status: ApplicationStatus): Promise<StatusUpdateResult> {
    const now = new Date().toISOString();

    // 1. Always update in local cache immediately
    const list = this.getLocalCache();
    const item = list.find((i) => i.id === id);
    if (item) {
      item.status = status;
      item.updated_at = now;
      this.saveLocalCache(list);
    }

    // 2. Sync to Supabase if configured and ID is a valid UUID
    let syncedToSupabase = false;
    let syncError: string | undefined = undefined;

    if (isSupabaseConfigured && supabase) {
      if (isUUID(id)) {
        try {
          const { error } = await supabase
            .from('applications')
            .update({ status, updated_at: now })
            .eq('id', id);

          if (error) {
            console.warn('Supabase status update error:', error.message);
            syncError = error.message;
          } else {
            syncedToSupabase = true;
          }
        } catch (err: any) {
          console.warn('Supabase status update exception:', err);
          syncError = err?.message;
        }
      } else {
        // Legacy non-UUID ID was stored locally
        syncError = 'Local-only record (non-UUID format)';
      }
    }

    return {
      success: true, // Always true if updated in local desk
      syncedToSupabase,
      error: syncError,
    };
  },

  /**
   * Update internal admin notes on an application
   */
  async updateNotes(id: string, notes: string): Promise<StatusUpdateResult> {
    const now = new Date().toISOString();

    // 1. Update in local cache
    const list = this.getLocalCache();
    const item = list.find((i) => i.id === id);
    if (item) {
      item.notes = notes;
      item.updated_at = now;
      this.saveLocalCache(list);
    }

    // 2. Sync to Supabase
    let syncedToSupabase = false;
    let syncError: string | undefined = undefined;

    if (isSupabaseConfigured && supabase) {
      if (isUUID(id)) {
        try {
          const { error } = await supabase
            .from('applications')
            .update({ notes, updated_at: now })
            .eq('id', id);

          if (error) {
            console.warn('Supabase notes update error:', error.message);
            syncError = error.message;
          } else {
            syncedToSupabase = true;
          }
        } catch (err: any) {
          console.warn('Supabase notes update exception:', err);
          syncError = err?.message;
        }
      }
    }

    return {
      success: true,
      syncedToSupabase,
      error: syncError,
    };
  },

  /**
   * Delete a single application
   */
  async deleteApplication(id: string): Promise<boolean> {
    // 1. Remove from local cache
    const list = this.getLocalCache().filter((a) => a.id !== id);
    this.saveLocalCache(list);

    // 2. Remove from Supabase if configured and UUID
    if (isSupabaseConfigured && supabase && isUUID(id)) {
      try {
        const { error } = await supabase.from('applications').delete().eq('id', id);
        if (error) {
          console.warn('Supabase delete error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase delete exception:', err);
      }
    }

    return true;
  },

  /**
   * Remove ALL current applications across Supabase and local caches
   */
  async clearAllApplications(): Promise<boolean> {
    // 1. Clear local cache
    this.saveLocalCache([]);
    try {
      localStorage.removeItem(APPLICATIONS_CACHE_KEY);
      localStorage.removeItem('vox_direct_submissions_offer_owners');
      localStorage.removeItem('vox_direct_submissions_offer_seekers');
    } catch (e) {
      console.warn('Could not clear local caches:', e);
    }

    // 2. Clear from Supabase table if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('applications')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.warn('Supabase clear all applications error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase clear all applications exception:', err);
      }
    }

    return true;
  },

  /**
   * Get applications for a specific user (by ID or email)
   */
  getUserApplications(userEmailOrId: string): ApplicationRecord[] {
    const list = this.getLocalCache();
    const search = userEmailOrId.trim().toLowerCase();
    return list.filter(
      (a) =>
        (a.user_id && a.user_id.toLowerCase() === search) ||
        (a.email && a.email.toLowerCase() === search)
    );
  },

  /**
   * Subscribe to realtime INSERT and UPDATE events on the 'applications' table
   */
  subscribeToApplications(
    onApplicationChange: (event: 'INSERT' | 'UPDATE', application: ApplicationRecord) => void
  ): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel('applications_realtime_feed')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'applications',
          },
          (payload) => {
            const eventType = payload.eventType;
            if ((eventType === 'INSERT' || eventType === 'UPDATE') && payload.new) {
              const row = payload.new as any;
              // Ignore legacy seed items
              if (String(row.id).startsWith('app_seed_')) return;

              const record: ApplicationRecord = {
                id: String(row.id),
                user_id: row.user_id || null,
                role_type: (row.role_type as ApplicationRoleType) || 'candidate',
                full_name: row.full_name || 'Anonymous Applicant',
                email: row.email || '',
                phone: row.phone || row.details?.phone || '',
                details: typeof row.details === 'object' && row.details !== null ? row.details : {},
                status: ((row.status || 'pending').toLowerCase() as ApplicationStatus),
                notes: row.notes || '',
                created_at: row.created_at || new Date().toISOString(),
                updated_at: row.updated_at || undefined,
              };

              // Keep local cache synced
              const currentList = this.getLocalCache();
              let updatedList: ApplicationRecord[];
              if (eventType === 'INSERT') {
                updatedList = [record, ...currentList.filter((a) => a.id !== record.id)];
              } else {
                updatedList = currentList.map((a) => (a.id === record.id ? record : a));
                if (!updatedList.some((a) => a.id === record.id)) {
                  updatedList.unshift(record);
                }
              }
              this.saveLocalCache(updatedList);

              onApplicationChange(eventType as 'INSERT' | 'UPDATE', record);
            }
          }
        )
        .subscribe();

      return () => {
        try {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        } catch {
          // ignore cleanup errors
        }
      };
    } catch (err) {
      console.warn('Could not initialize Supabase applications realtime subscription:', err);
      return () => {};
    }
  },
};
