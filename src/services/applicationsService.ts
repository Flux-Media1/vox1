/**
 * Applications Persistence Service for Vox Direct
 * 
 * Persists incoming Offer Owner and Candidate submissions to the Supabase
 * 'public.applications' table, with local caching and real-time syncing.
 */

import { ApplicationRecord, ApplicationRoleType, ApplicationStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const APPLICATIONS_CACHE_KEY = 'vox_direct_supabase_applications_cache';

export const applicationsService = {
  /**
   * Reads cached applications from local storage (starts empty)
   */
  getLocalCache(): ApplicationRecord[] {
    try {
      const raw = localStorage.getItem(APPLICATIONS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Filter out any legacy seed/demo records if previously cached
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
   * Fetch all applications (from Supabase if configured, otherwise local cache)
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
            status: (row.status as ApplicationStatus) || 'pending',
            notes: row.notes || '',
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || undefined,
          }));
          this.saveLocalCache(mapped);
          return { data: mapped, fromSupabase: true };
        }

        if (error) {
          console.warn('Supabase applications fetch returned error (falling back to cache):', error.message);
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
    const recordId = 'app_' + Math.random().toString(36).substring(2, 11);
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
              user_id: params.userId || null,
              role_type: params.roleType,
              full_name: params.fullName,
              email: params.email,
              phone: params.phone || null,
              details: params.details,
              status: 'pending',
              created_at: now,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          savedToSupabase = true;
          // Replace generated id with Supabase ID
          record.id = String(data.id);
          const syncdList = [record, ...currentList.filter((item) => item.id !== recordId)];
          this.saveLocalCache(syncdList);
        } else if (error) {
          console.warn('Could not insert application to Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Exception during Supabase application insertion:', err);
      }
    }

    return { record, savedToSupabase };
  },

  /**
   * Update an application's review status
   */
  async updateStatus(id: string, status: ApplicationStatus): Promise<boolean> {
    const now = new Date().toISOString();

    // 1. Update in local cache
    const list = this.getLocalCache();
    const item = list.find((i) => i.id === id);
    if (item) {
      item.status = status;
      item.updated_at = now;
      this.saveLocalCache(list);
    }

    // 2. Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('applications')
          .update({ status, updated_at: now })
          .eq('id', id);

        if (error) {
          console.warn('Supabase status update error:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Supabase status update exception:', err);
        return false;
      }
    }

    return true;
  },

  /**
   * Update internal admin notes on an application
   */
  async updateNotes(id: string, notes: string): Promise<boolean> {
    const now = new Date().toISOString();

    // 1. Update in local cache
    const list = this.getLocalCache();
    const item = list.find((i) => i.id === id);
    if (item) {
      item.notes = notes;
      item.updated_at = now;
      this.saveLocalCache(list);
    }

    // 2. Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('applications')
          .update({ notes, updated_at: now })
          .eq('id', id);

        if (error) {
          console.warn('Supabase notes update error:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Supabase notes update exception:', err);
        return false;
      }
    }

    return true;
  },

  /**
   * Delete a single application
   */
  async deleteApplication(id: string): Promise<boolean> {
    // 1. Remove from local cache
    const list = this.getLocalCache().filter((a) => a.id !== id);
    this.saveLocalCache(list);

    // 2. Remove from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('applications').delete().eq('id', id);
        if (error) {
          console.warn('Supabase delete error:', error.message);
          return false;
        }
      } catch (err) {
        console.warn('Supabase delete exception:', err);
        return false;
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
        // Delete all rows in public.applications table
        const { error } = await supabase
          .from('applications')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.warn('Supabase clear all applications error:', error.message);
          return false;
        }
      } catch (err) {
        console.warn('Supabase clear all applications exception:', err);
        return false;
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
};
