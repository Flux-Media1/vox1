/**
 * Bi-directional Messaging Persistence & Realtime Service for Vox Direct
 * 
 * Facilitates direct messaging between Admin desk and Applicants for specific applications.
 * - Backed by Supabase 'public.messages' table with local cache fallback
 * - Realtime subscriptions via Supabase Channels (postgres_changes)
 * - Immediate local dispatch for instantaneous UI updates
 */

import { MessageRecord, MessageSenderRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, isUUID } from './applicationsService';

const MESSAGES_CACHE_KEY = 'vox_direct_supabase_messages_cache';
const MESSAGES_EVENT = 'vox_direct_messages_updated';

let memoryMessagesStore: MessageRecord[] = [];

export const messagesService = {
  /**
   * Reads cached messages from localStorage or in-memory fallback
   */
  getLocalCache(): MessageRecord[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(MESSAGES_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        }
      }
      return memoryMessagesStore;
    } catch {
      return memoryMessagesStore;
    }
  },

  /**
   * Saves messages to localStorage and dispatches a browser update event
   */
  saveLocalCache(items: MessageRecord[]): void {
    memoryMessagesStore = items;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(items));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(MESSAGES_EVENT, { detail: items }));
      }
    } catch (e) {
      console.warn('Could not save messages cache:', e);
    }
  },

  /**
   * Get all messages for a specific application in chronological order
   */
  async getMessagesByApplication(
    applicationId: string
  ): Promise<{ data: MessageRecord[]; fromSupabase: boolean; error?: string }> {
    const localItems = this.getLocalCache().filter(
      (m) => m.application_id === applicationId
    );

    if (isSupabaseConfigured && supabase && isUUID(applicationId)) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(data)) {
          const mapped: MessageRecord[] = data.map((row: any) => ({
            id: String(row.id),
            application_id: String(row.application_id),
            recipient_user_id: row.recipient_user_id || null,
            sender_email: row.sender_email || '',
            sender_role: (row.sender_role as MessageSenderRole) || 'applicant',
            content: row.content || '',
            is_read: Boolean(row.is_read),
            created_at: row.created_at || new Date().toISOString(),
          }));

          // Merge with any local messages not yet in Supabase
          const supabaseIds = new Set(mapped.map((m) => m.id));
          const unsynced = localItems.filter((m) => !supabaseIds.has(m.id));
          const combined = [...mapped, ...unsynced].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          // Update total cache with merged results
          const allLocal = this.getLocalCache();
          const otherMessages = allLocal.filter((m) => m.application_id !== applicationId);
          this.saveLocalCache([...otherMessages, ...combined]);

          return { data: combined, fromSupabase: true };
        }

        if (error) {
          console.warn('Supabase fetch messages notice:', error.message);
          return { data: localItems, fromSupabase: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('Supabase fetch messages exception:', err);
        return { data: localItems, fromSupabase: false, error: err?.message };
      }
    }

    return { data: localItems, fromSupabase: false };
  },

  /**
   * Get all messages across any application where recipient matches user id or email
   */
  async getMessagesForUser(
    userEmailOrId: string
  ): Promise<{ data: MessageRecord[]; fromSupabase: boolean }> {
    const search = userEmailOrId.trim().toLowerCase();
    const local = this.getLocalCache().filter(
      (m) =>
        (m.recipient_user_id && m.recipient_user_id.toLowerCase() === search) ||
        (m.sender_email && m.sender_email.toLowerCase() === search)
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`recipient_user_id.eq.${userEmailOrId},sender_email.eq.${userEmailOrId}`)
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(data)) {
          const mapped: MessageRecord[] = data.map((row: any) => ({
            id: String(row.id),
            application_id: String(row.application_id),
            recipient_user_id: row.recipient_user_id || null,
            sender_email: row.sender_email || '',
            sender_role: (row.sender_role as MessageSenderRole) || 'applicant',
            content: row.content || '',
            is_read: Boolean(row.is_read),
            created_at: row.created_at || new Date().toISOString(),
          }));
          return { data: mapped, fromSupabase: true };
        }
      } catch {
        // fallback to local
      }
    }

    return { data: local, fromSupabase: false };
  },

  /**
   * Compute unread message count for a recipient
   */
  getUnreadCountForRecipient(
    recipientUserIdOrEmail: string,
    role: MessageSenderRole,
    applicationId?: string
  ): number {
    const all = this.getLocalCache();
    const search = recipientUserIdOrEmail.trim().toLowerCase();
    return all.filter((m) => {
      if (m.is_read) return false;
      if (applicationId && m.application_id !== applicationId) return false;
      // If role is applicant, count unread messages sent by admin
      if (role === 'applicant') {
        const matchesUser =
          (m.recipient_user_id && m.recipient_user_id.toLowerCase() === search) ||
          m.recipient_user_id === 'applicant';
        return m.sender_role === 'admin' && (matchesUser || !m.recipient_user_id);
      }
      // If role is admin, count unread messages sent by applicant
      return m.sender_role === 'applicant';
    }).length;
  },

  /**
   * Send a message
   */
  async sendMessage(params: {
    applicationId?: string | null;
    recipientUserId?: string | null;
    senderEmail: string;
    senderRole: MessageSenderRole;
    content: string;
  }): Promise<{ record: MessageRecord; syncedToSupabase: boolean; error?: string }> {
    const messageId = generateUUID();
    const now = new Date().toISOString();
    const validAppId = params.applicationId && isUUID(params.applicationId) ? params.applicationId : null;

    const record: MessageRecord = {
      id: messageId,
      application_id: validAppId || params.applicationId || null,
      recipient_user_id: params.recipientUserId || null,
      sender_email: params.senderEmail,
      sender_role: params.senderRole,
      content: params.content.trim(),
      is_read: false,
      created_at: now,
    };

    // 1. Immediately store in local cache
    const currentList = this.getLocalCache();
    const updatedList = [...currentList, record];
    this.saveLocalCache(updatedList);

    // 2. Sync to Supabase
    let syncedToSupabase = false;
    let syncError: string | undefined = undefined;

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: messageId,
          application_id: validAppId,
          recipient_user_id: params.recipientUserId || null,
          sender_email: params.senderEmail,
          sender_role: params.senderRole,
          content: record.content,
          is_read: false,
          created_at: now,
        };

        const { data, error } = await supabase
          .from('messages')
          .insert([payload])
          .select()
          .maybeSingle();

        if (!error && data) {
          syncedToSupabase = true;
        } else if (error) {
          // If foreign key constraint violates 'messages_application_id_fkey' (Postgres error 23503),
          // retry with application_id set to null (profile-level message fallback)
          if (error.code === '23503' && payload.application_id !== null) {
            console.warn('[messagesService] Foreign key constraint 23503 encountered. Retrying with application_id: null fallback...', error.message);
            const fallbackRes = await supabase
              .from('messages')
              .insert([{ ...payload, application_id: null }])
              .select()
              .maybeSingle();

            if (!fallbackRes.error && fallbackRes.data) {
              syncedToSupabase = true;
            } else {
              console.warn('[messagesService] Fallback insert failed:', fallbackRes.error?.message);
              syncError = fallbackRes.error?.message || error.message;
            }
          } else {
            console.warn('Supabase insert message notice (RLS or policy):', error.message);
            syncError = error.message;
          }
        }
      } catch (err: any) {
        console.warn('Exception during Supabase message insertion:', err);
        syncError = err?.message;
      }
    }

    return { record, syncedToSupabase, error: syncError };
  },

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<boolean> {
    if (!messageIds || messageIds.length === 0) return true;
    const targetSet = new Set(messageIds);

    // 1. Update in local cache
    const list = this.getLocalCache();
    let hasChanges = false;
    list.forEach((m) => {
      if (targetSet.has(m.id) && !m.is_read) {
        m.is_read = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveLocalCache(list);
    }

    // 2. Sync to Supabase
    if (isSupabaseConfigured && supabase) {
      const validUuids = messageIds.filter((id) => isUUID(id));
      if (validUuids.length > 0) {
        try {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', validUuids);
        } catch (e) {
          console.warn('Could not mark messages read in Supabase:', e);
        }
      }
    }

    return true;
  },

  /**
   * Subscribe to realtime updates for an application's messages
   */
  subscribeToMessages(
    applicationId: string,
    onNewMessage: (msg: MessageRecord) => void
  ): () => void {
    // 1. Browser custom event listener for in-session reactivity
    const handleLocalEvent = (e: Event) => {
      const customEvent = e as CustomEvent<MessageRecord[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        const appMessages = customEvent.detail.filter(
          (m) => m.application_id === applicationId
        );
        if (appMessages.length > 0) {
          const latest = appMessages[appMessages.length - 1];
          onNewMessage(latest);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(MESSAGES_EVENT, handleLocalEvent);
    }

    // 2. Supabase Realtime channel
    let channel: any = null;
    if (isSupabaseConfigured && supabase && isUUID(applicationId)) {
      try {
        const channelName = `messages_room_${applicationId.substring(0, 8)}`;
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `application_id=eq.${applicationId}`,
            },
            (payload) => {
              if (payload.new) {
                const row = payload.new as any;
                const record: MessageRecord = {
                  id: String(row.id),
                  application_id: String(row.application_id),
                  recipient_user_id: row.recipient_user_id || null,
                  sender_email: row.sender_email || '',
                  sender_role: (row.sender_role as MessageSenderRole) || 'applicant',
                  content: row.content || '',
                  is_read: Boolean(row.is_read),
                  created_at: row.created_at || new Date().toISOString(),
                };
                onNewMessage(record);
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Could not initialize Supabase realtime channel:', err);
      }
    }

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(MESSAGES_EVENT, handleLocalEvent);
      }
      if (channel && supabase) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  },
};
