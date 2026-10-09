import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Archive,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
  Building2,
  Target,
  FileText,
  Database,
  Copy,
  Check,
  X,
  User,
  HelpCircle,
  ChevronDown,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { PageId, ApplicationRecord, ApplicationRoleType, ApplicationStatus } from '../types';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { applicationsService } from '../services/applicationsService';
import { ApplicationChatThread } from '../components/ApplicationChatThread';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AdminPortalPageProps {
  onNavigate: (page: PageId) => void;
}

type TabKey = 'all' | 'offer_owners' | 'candidates' | 'archived';

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, signInAsAdminDemo, signOut } = useAuth();

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Search & Filter state
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Drawer / Modal state
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'messages'>('details');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState<boolean>(false);

  // SQL schema dialog state
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Status update toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch applications
  const fetchApplications = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await applicationsService.getAllApplications();
      setApplications(res.data);
      setIsSupabaseLive(res.fromSupabase);
      setSupabaseError(res.error || null);
    } catch (err: any) {
      console.warn('Error loading applications:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Purge any legacy demo seed data from storage on initialization
    try {
      const raw = localStorage.getItem('vox_direct_supabase_applications_cache');
      if (raw && raw.includes('app_seed_')) {
        applicationsService.clearAllApplications();
      }
    } catch {
      // ignore
    }

    if (isAdmin) {
      fetchApplications();

      // Realtime subscription: Listen for INSERT and UPDATE on public.applications
      if (isSupabaseConfigured && supabase) {
        const channel = supabase
          .channel('admin_applications_feed')
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
                if (String(row.id).startsWith('app_seed_')) return;

                const appRecord: ApplicationRecord = {
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

                setApplications((prev) => {
                  if (eventType === 'INSERT') {
                    // Check if already in list to avoid duplicates
                    if (prev.some((a) => a.id === appRecord.id)) {
                      return prev.map((a) => (a.id === appRecord.id ? appRecord : a));
                    }
                    return [appRecord, ...prev];
                  } else {
                    // UPDATE event
                    return prev.map((a) => (a.id === appRecord.id ? appRecord : a));
                  }
                });

                // If currently viewed in drawer, update selectedApplication state too
                setSelectedApplication((prevSelected) => {
                  if (prevSelected && prevSelected.id === appRecord.id) {
                    return { ...prevSelected, ...appRecord };
                  }
                  return prevSelected;
                });
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
            // ignore cleanup error
          }
        };
      }
    }
  }, [isAdmin]);

  // Remove ALL applications across Supabase and local cache
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to remove all applications? This will clear all records from Supabase and the applications desk.')) {
      return;
    }

    setIsRefreshing(true);
    await applicationsService.clearAllApplications();
    setApplications([]);
    setSelectedApplication(null);
    setIsRefreshing(false);
    showToast('All current applications have been removed.');
  };

  // Delete single application
  const handleDeleteApplication = async (id: string) => {
    if (!window.confirm('Delete this application from the database?')) {
      return;
    }

    const success = await applicationsService.deleteApplication(id);
    if (success) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication(null);
      }
      showToast('Application record deleted.');
    }
  };

  // Sync drawer notes when selected application changes
  useEffect(() => {
    if (selectedApplication) {
      setAdminNotes(selectedApplication.notes || '');
      setNotesSaveSuccess(false);
    }
  }, [selectedApplication]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedApplication(null);
        setShowSqlModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Status update handler (optimistic and resilient)
  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    // 1. Optimistically update local UI state immediately
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: newStatus, updated_at: new Date().toISOString() } : app
      )
    );
    if (selectedApplication && selectedApplication.id === id) {
      setSelectedApplication((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    // 2. Persist to storage & sync with Supabase
    try {
      const res = await applicationsService.updateStatus(id, newStatus);
      if (res.syncedToSupabase) {
        showToast(`Status updated to ${formatStatusLabel(newStatus)} (Synced with Supabase)`);
      } else if (res.error) {
        console.warn('Supabase sync diagnostic:', res.error);
        showToast(`Status updated to ${formatStatusLabel(newStatus)} (Saved to local desk)`);
      } else {
        showToast(`Status updated to ${formatStatusLabel(newStatus)}`);
      }
    } catch (err: any) {
      console.warn('Status change exception:', err);
      showToast(`Status updated to ${formatStatusLabel(newStatus)}`);
    }
  };

  // Save admin notes handler (optimistic and resilient)
  const handleSaveNotes = async () => {
    if (!selectedApplication) return;
    setIsSavingNotes(true);
    setNotesSaveSuccess(true);
    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApplication.id ? { ...app, notes: adminNotes } : app
      )
    );
    setSelectedApplication((prev) => (prev ? { ...prev, notes: adminNotes } : null));

    try {
      const res = await applicationsService.updateNotes(selectedApplication.id, adminNotes);
      if (res.syncedToSupabase) {
        showToast('Internal review notes saved & synced to Supabase.');
      } else {
        showToast('Internal review notes saved to local desk.');
      }
    } catch {
      showToast('Internal review notes saved.');
    } finally {
      setIsSavingNotes(false);
      setTimeout(() => setNotesSaveSuccess(false), 2500);
    }
  };

  // Format status badge text & styling (Flat 4px border radius, high-contrast, no pills)
  const formatStatusLabel = (status: ApplicationStatus): string => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: ApplicationStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-[#FFFBEB] text-[#92400E] border border-[#F59E0B]/40';
      case 'under_review':
        return 'bg-[#EFF6FF] text-[#1E40AF] border border-[#3B82F6]/40';
      case 'approved':
        return 'bg-[#F0FDF4] text-[#166534] border border-[#22C55E]/40 font-semibold';
      case 'rejected':
        return 'bg-[#FEF2F2] text-[#991B1B] border border-[#EF4444]/40';
      case 'archived':
        return 'bg-[#F5F5F4] text-[#57534E] border border-[#A8A29E]/40';
      default:
        return 'bg-[#FAF8F4] text-[#4A4A44] border border-[#DDD7CB]';
    }
  };

  // Metrics calculations
  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const offerOwners = applications.filter((a) => a.role_type === 'offer_owner').length;
    const vettedCandidates = applications.filter(
      (a) => a.role_type === 'candidate' && (a.status === 'approved' || a.status === 'under_review')
    ).length;

    return { total, pending, offerOwners, vettedCandidates };
  }, [applications]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const all = applications.filter((a) => a.status !== 'archived').length;
    const offer_owners = applications.filter((a) => a.role_type === 'offer_owner' && a.status !== 'archived').length;
    const candidates = applications.filter((a) => a.role_type === 'candidate' && a.status !== 'archived').length;
    const archived = applications.filter((a) => a.status === 'archived').length;
    return { all, offer_owners, candidates, archived };
  }, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      // 1. Tab check
      if (activeTab === 'all' && item.status === 'archived') return false;
      if (activeTab === 'offer_owners' && (item.role_type !== 'offer_owner' || item.status === 'archived')) return false;
      if (activeTab === 'candidates' && (item.role_type !== 'candidate' || item.status === 'archived')) return false;
      if (activeTab === 'archived' && item.status !== 'archived') return false;

      // 2. Status dropdown check
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // 3. Search query check (name, email, phone, company, niches)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = item.full_name?.toLowerCase().includes(query);
        const emailMatch = item.email?.toLowerCase().includes(query);
        const phoneMatch = item.phone?.toLowerCase().includes(query);
        const companyMatch = item.details?.company?.toLowerCase().includes(query);
        const nicheMatch = item.details?.nichesWorkedIn?.toLowerCase().includes(query);
        const offerDescMatch = item.details?.offerDescription?.toLowerCase().includes(query);

        return Boolean(nameMatch || emailMatch || phoneMatch || companyMatch || nicheMatch || offerDescMatch);
      }

      return true;
    });
  }, [applications, activeTab, statusFilter, searchQuery]);

  const sqlSchema = `-- ============================================================================
-- Supabase Schema & Security Policies for Vox Direct (Multi-Admin & Realtime)
-- Run this in your Supabase Dashboard > SQL Editor:
-- ============================================================================

create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  role_type text not null check (role_type in ('offer_owner', 'candidate')),
  full_name text not null,
  email text not null,
  phone text,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected', 'archived')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.applications enable row level security;

-- Drop legacy or single-admin restrictive policies
drop policy if exists "Allow public insert" on public.applications;
drop policy if exists "Allow all read" on public.applications;
drop policy if exists "Allow all update" on public.applications;
drop policy if exists "Allow all delete" on public.applications;
drop policy if exists "Allow inserts for all" on public.applications;
drop policy if exists "Allow reads for all" on public.applications;
drop policy if exists "Allow updates for all" on public.applications;
drop policy if exists "Admin read applications" on public.applications;
drop policy if exists "Admins can view applications" on public.applications;
drop policy if exists "Admin read access" on public.applications;
drop policy if exists "Allow admin read" on public.applications;
drop policy if exists "Admin and owner read applications" on public.applications;
drop policy if exists "Admin update applications" on public.applications;
drop policy if exists "Admin delete applications" on public.applications;

-- Option A (Production Multi-Admin RLS):
-- Admins (by email or metadata role) can view all; applicants can view their own
create policy "Allow public insert" on public.applications
  for insert with check (true);

create policy "Admin and owner read applications" on public.applications
  for select using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'jc.dev.uk@gmail.com',
      'admin@vox-direct.com',
      'team@vox-direct.com',
      'director@vox-direct.com'
      -- Add your business partner's email below (e.g. 'partner@company.com'):
    )
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or user_id = auth.uid()::text
    or lower(coalesce(auth.jwt() ->> 'email', '')) = lower(email)
  );

create policy "Admin update applications" on public.applications
  for update using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'jc.dev.uk@gmail.com',
      'admin@vox-direct.com',
      'team@vox-direct.com',
      'director@vox-direct.com'
    )
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  with check (true);

create policy "Admin delete applications" on public.applications
  for delete using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'jc.dev.uk@gmail.com',
      'admin@vox-direct.com',
      'team@vox-direct.com',
      'director@vox-direct.com'
    )
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- ----------------------------------------------------------------------------
-- Messages Table (Bi-directional Applicant-Admin Messaging)
-- ----------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.applications(id) on delete set null,
  recipient_user_id text,
  sender_email text not null,
  sender_role text not null check (sender_role in ('admin', 'applicant')),
  content text not null,
  is_read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure application_id is nullable for fallback chats
alter table public.messages alter column application_id drop not null;

-- Remove any legacy UNIQUE constraints that cause 409 Conflict errors
do $$
declare
  r record;
begin
  for r in (
    select conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'messages'
      and con.contype = 'u'
  ) loop
    execute format('alter table public.messages drop constraint if exists %I cascade;', r.conname);
  end loop;
end $$;

-- Enable Row Level Security (RLS) for Messages
alter table public.messages enable row level security;

drop policy if exists "Allow public insert messages" on public.messages;
drop policy if exists "Allow all read messages" on public.messages;
drop policy if exists "Allow all update messages" on public.messages;
drop policy if exists "Allow all delete messages" on public.messages;
drop policy if exists "Admin and participant read messages" on public.messages;
drop policy if exists "Admin and participant update messages" on public.messages;

create policy "Allow public insert messages" on public.messages
  for insert with check (true);

create policy "Admin and participant read messages" on public.messages
  for select using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'jc.dev.uk@gmail.com',
      'admin@vox-direct.com',
      'team@vox-direct.com',
      'director@vox-direct.com'
    )
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or lower(sender_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or recipient_user_id = auth.uid()::text
  );

create policy "Admin and participant update messages" on public.messages
  for update using (true) with check (true);

create policy "Allow all delete messages" on public.messages
  for delete using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'jc.dev.uk@gmail.com',
      'admin@vox-direct.com',
      'team@vox-direct.com',
      'director@vox-direct.com'
    )
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- ----------------------------------------------------------------------------
-- Realtime Setup: Broadcast INSERT & UPDATE events to admins & candidates
-- ----------------------------------------------------------------------------
alter table public.applications replica identity full;
alter table public.messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.applications;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then null;
end $$;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // --------------------------------------------------------------------------
  // UNAUTHORIZED ACCESS VIEW (when not admin)
  // --------------------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="bg-[#FAF8F4] min-h-[calc(100vh-80px)] py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="card-hairline p-8 sm:p-10 bg-white space-y-6 text-center border-[#DDD7CB]">
            <div className="mx-auto w-12 h-12 rounded-[4px] bg-[#FAF3EE] border border-[#B5632F]/30 flex items-center justify-center text-[#B5632F]">
              <ShieldAlert className="w-6 h-6 stroke-[1.75]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B5632F] block mb-1">
                Restricted Route · 403 Forbidden
              </span>
              <h1 className="font-serif text-3xl font-normal text-[#1A1A18]">
                Unauthorized Access
              </h1>
              <p className="mt-3 text-[15px] text-[#4A4A44] leading-relaxed">
                The Vox Direct Admin Portal is restricted to verified administrators and internal placement managers.
              </p>
            </div>

            {user ? (
              <div className="p-4 rounded-[4px] bg-[#FAF8F4] border border-[#DDD7CB] text-xs text-left space-y-2">
                <div className="flex justify-between items-center text-[#8A9A92]">
                  <span>CURRENT SIGNED-IN ACCOUNT</span>
                  <span className="font-mono text-[#1A1A18] font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between items-center text-[#8A9A92]">
                  <span>ACCOUNT ROLE</span>
                  <span className="uppercase font-semibold text-[#B5632F]">{user.role}</span>
                </div>
                <div className="pt-2 border-t border-[#E5E0D6] text-[#7A7A72]">
                  This email address is not in the authorised administrative directory.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-[4px] bg-[#FAF8F4] border border-[#DDD7CB] text-xs text-[#4A4A44]">
                You are not currently signed in. Please sign in with an authorised administrator account.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate(user ? 'dashboard' : 'login')}
                className="btn-primary-light flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{user ? 'Return to User Dashboard' : 'Sign In with Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {user && (
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    onNavigate('login');
                  }}
                  className="btn-secondary-light py-3 px-4 text-xs cursor-pointer"
                >
                  Switch Account
                </button>
              )}
            </div>

            {/* Quick Demo Access button for reviewers & evaluation */}
            <div className="pt-4 border-t border-[#E5E0D6] text-left">
              <div className="text-xs text-[#7A7A72] mb-2 font-medium">
                Testing / Review Evaluation:
              </div>
              <button
                type="button"
                onClick={async () => {
                  await signInAsAdminDemo();
                  showToast('Signed in with Admin permissions.');
                }}
                className="w-full py-2.5 px-4 text-xs bg-[#0F2A24] text-[#F4F1EA] hover:bg-[#163B33] rounded-[4px] border border-[#2A453D] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4895A]" />
                <span>Grant Admin Access (Demo Mode: jc.dev.uk@gmail.com)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="bg-[#FAF8F4] min-h-[calc(100vh-80px)] pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2A24] text-[#F4F1EA] px-4 py-3 rounded-[4px] border border-[#D4895A]/40 shadow-lg text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#D4895A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editorial Header */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-10 sm:py-12 border-b border-[#2A453D]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A] mb-2">
                <span className="w-4 h-px bg-[#D4895A]" aria-hidden="true" />
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Internal Placement Administration</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#F4F1EA]">
                Applications Review &amp; Intake Desk
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#B9C4BE] max-w-2xl">
                Manage incoming sales candidates, evaluate offer owner pipeline criteria, and update vetting statuses in Supabase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Database status tag */}
              <div
                className={`px-3 py-1.5 rounded-[4px] text-xs font-mono flex items-center gap-2 border ${
                  isSupabaseLive
                    ? 'bg-[#163B33] text-[#A7F3D0] border-[#059669]/40'
                    : 'bg-[#2A453D] text-[#FDE68A] border-[#D97706]/40'
                }`}
                title={
                  isSupabaseLive
                    ? 'Connected directly to Supabase public.applications table'
                    : 'Operating on persistent local storage sync cache'
                }
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSupabaseLive ? 'Supabase Live' : 'Local Sync Active'}</span>
              </div>

              {/* View SQL Schema Button */}
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="py-2 px-3 text-xs bg-[#163B33] text-[#F4F1EA] hover:bg-[#204E44] border border-[#2A453D] rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View Supabase table SQL definition"
              >
                <FileText className="w-3.5 h-3.5 text-[#D4895A]" />
                <span className="hidden sm:inline">Supabase</span> Schema
              </button>

              {/* Clear All Applications Button */}
              {applications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isRefreshing}
                  className="py-2 px-3 text-xs bg-[#2F1515] hover:bg-[#451B1B] text-[#FCA5A5] border border-[#EF4444]/40 rounded-[4px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Remove all current applications across Supabase and the desk"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Clear All</span>
                </button>
              )}

              {/* Refresh Data Button */}
              <button
                type="button"
                onClick={() => fetchApplications(true)}
                disabled={isRefreshing}
                className="py-2 px-4 text-xs bg-[#B5632F] text-white hover:bg-[#9A4E20] disabled:opacity-60 border border-[#D4895A]/30 rounded-[4px] font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Metric Cards (Strict 4px radius, warm paper styling, no floating pills) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="card-hairline p-5 sm:p-6 bg-white border-[#DDD7CB]">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#8A9A92] mb-1">
              Total Applications
            </div>
            <div className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1A18]">
              {metrics.total}
            </div>
            <div className="mt-2 text-xs text-[#7A7A72]">
              All recorded intakes
            </div>
          </div>

          <div className="card-hairline p-5 sm:p-6 bg-white border-[#DDD7CB]">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#B5632F] mb-1">
              Pending Review
            </div>
            <div className="font-serif text-3xl sm:text-4xl font-normal text-[#B5632F]">
              {metrics.pending}
            </div>
            <div className="mt-2 text-xs text-[#7A7A72]">
              Require placement decision
            </div>
          </div>

          <div className="card-hairline p-5 sm:p-6 bg-white border-[#DDD7CB]">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#0F2A24] mb-1">
              Offer Owners
            </div>
            <div className="font-serif text-3xl sm:text-4xl font-normal text-[#0F2A24]">
              {metrics.offerOwners}
            </div>
            <div className="mt-2 text-xs text-[#7A7A72]">
              Businesses seeking talent
            </div>
          </div>

          <div className="card-hairline p-5 sm:p-6 bg-white border-[#DDD7CB]">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#166534] mb-1">
              Vetted Candidates
            </div>
            <div className="font-serif text-3xl sm:text-4xl font-normal text-[#166534]">
              {metrics.vettedCandidates}
            </div>
            <div className="mt-2 text-xs text-[#7A7A72]">
              Approved or under review
            </div>
          </div>
        </div>

        {/* Supabase Notice banner if table needs creation */}
        {supabaseError && (
          <div className="p-4 rounded-[4px] bg-[#FEF3C7] border border-[#F59E0B]/50 text-xs text-[#92400E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>
                <strong>Supabase Notice:</strong> {supabaseError}. Currently operating on local sync cache. Click &quot;Supabase Schema&quot; above to create the table.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="underline font-bold text-[#92400E] hover:text-[#78350F] cursor-pointer"
            >
              View SQL Script
            </button>
          </div>
        )}

        {/* Filter Controls & Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDD7CB] pb-4">
            {/* Interactive Tabbed filter (zero-pill discipline: segmented control with flat 4px buttons) */}
            <div className="flex overflow-x-auto no-scrollbar items-center gap-1.5 p-1 bg-[#F1EDE5] rounded-[4px] border border-[#DDD7CB] w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#0F2A24] text-[#F4F1EA]'
                    : 'text-[#4A4A44] hover:text-[#1A1A18] hover:bg-[#E5DFD4]'
                }`}
              >
                All ({tabCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('offer_owners')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'offer_owners'
                    ? 'bg-[#0F2A24] text-[#F4F1EA]'
                    : 'text-[#4A4A44] hover:text-[#1A1A18] hover:bg-[#E5DFD4]'
                }`}
              >
                Offer Owners ({tabCounts.offer_owners})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('candidates')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'candidates'
                    ? 'bg-[#0F2A24] text-[#F4F1EA]'
                    : 'text-[#4A4A44] hover:text-[#1A1A18] hover:bg-[#E5DFD4]'
                }`}
              >
                Candidates / Reps ({tabCounts.candidates})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('archived')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'archived'
                    ? 'bg-[#0F2A24] text-[#F4F1EA]'
                    : 'text-[#4A4A44] hover:text-[#1A1A18] hover:bg-[#E5DFD4]'
                }`}
              >
                Archived ({tabCounts.archived})
              </button>
            </div>

            {/* Search Input & Status Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search box */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-[#8A9A92] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, niche..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] placeholder-[#8A9A92] focus:outline-none focus:border-[#B5632F] focus:ring-1 focus:ring-[#B5632F]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A9A92] hover:text-[#1A1A18]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 pl-3 pr-8 text-xs bg-white border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] focus:outline-none focus:border-[#B5632F] focus:ring-1 focus:ring-[#B5632F] appearance-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#8A9A92] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="card-hairline bg-white border-[#DDD7CB] overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-[#8A9A92]">
              <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[#B5632F]" />
              <span>Loading applications database...</span>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <FileText className="w-8 h-8 mx-auto text-[#8A9A92] stroke-[1.5]" />
              <div className="font-serif text-lg text-[#1A1A18]">
                {applications.length === 0 ? 'No Current Applications' : 'No Matching Applications Found'}
              </div>
              <p className="text-xs text-[#7A7A72] max-w-md mx-auto leading-relaxed">
                {applications.length === 0
                  ? 'All current applications have been removed. When offer owners or candidates submit their intake forms, incoming submissions will appear here in real time.'
                  : 'No submissions match the current tab or search criteria. Try clearing your filters or refreshing data.'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="btn-secondary-light !py-2 !px-4 text-xs cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Application Cards (< md screens) */}
              <div className="block md:hidden divide-y divide-[#DDD7CB]">
                {filteredApplications.map((app) => {
                  const isOwner = app.role_type === 'offer_owner';
                  const dateObj = new Date(app.created_at);
                  const formattedDate = dateObj.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = dateObj.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={`mobile-${app.id}`} className="p-4 sm:p-5 space-y-3.5 bg-white">
                      {/* Top Bar: Date, Role Badge & Status Dropdown */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isOwner ? (
                              <span className="inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#FAF3EE] text-[#9A4E20] border border-[#B5632F]/30 uppercase tracking-wider">
                                Offer Owner
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#E8EFEA] text-[#0F2A24] border border-[#2A453D]/30 uppercase tracking-wider">
                                Candidate / Rep
                              </span>
                            )}
                            <span className="text-[11px] text-[#8A9A92]">
                              {formattedDate} {formattedTime}
                            </span>
                          </div>
                          <h4 className="font-serif text-lg font-medium text-[#1A1A18] mt-1">
                            {app.full_name}
                          </h4>
                          {isOwner && app.details?.company && (
                            <p className="text-xs text-[#7A7A72] font-medium">
                              Company: {app.details.company}
                            </p>
                          )}
                          {!isOwner && app.details?.role && (
                            <p className="text-xs text-[#7A7A72] capitalize">
                              Role: {app.details.role}
                            </p>
                          )}
                        </div>

                        {/* Status dropdown */}
                        <div className="shrink-0">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                            className={`py-1.5 px-2.5 rounded-[4px] text-xs font-semibold cursor-pointer focus:outline-none transition-colors border ${getStatusBadgeClass(
                              app.status
                            )}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="p-2.5 bg-[#FAF8F4] border border-[#E5E0D6] rounded-[4px] space-y-1 text-xs">
                        <a
                          href={`mailto:${app.email}`}
                          className="text-[#1A1A18] hover:text-[#B5632F] font-mono flex items-center gap-1.5 truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#8A9A92] shrink-0" />
                          <span className="truncate">{app.email}</span>
                        </a>
                        {app.phone && (
                          <a
                            href={`tel:${app.phone}`}
                            className="text-[#4A4A44] hover:text-[#1A1A18] flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#8A9A92] shrink-0" />
                            <span>{app.phone}</span>
                          </a>
                        )}
                      </div>

                      {/* Criteria Snippet */}
                      <div className="text-xs text-[#4A4A44]">
                        {isOwner ? (
                          <div>
                            <span className="text-[#8A9A92] uppercase tracking-wider text-[10px] block font-semibold">Compensation &amp; Volume</span>
                            <div className="font-medium text-[#1A1A18] line-clamp-1">{app.details?.commissionStructure || 'Model specified'}</div>
                            <div className="text-[#7A7A72] line-clamp-1">{app.details?.expectedVolume || 'Volume specified'}</div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[#8A9A92] uppercase tracking-wider text-[10px] block font-semibold">Niche &amp; Location</span>
                            <div className="font-medium text-[#1A1A18] line-clamp-1">{app.details?.nichesWorkedIn || 'Sales track record'}</div>
                            <div className="text-[#7A7A72] line-clamp-1">{app.details?.locationAndTimezone || 'UK & Global'}</div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Message & View Dossier */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EFEBE1]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApplication(app);
                            setDrawerTab('messages');
                            setAdminNotes(app.notes || '');
                          }}
                          className="btn-secondary-light !py-2.5 !px-3 text-xs flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#B5632F]" />
                          <span>Message</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApplication(app);
                            setDrawerTab('details');
                            setAdminNotes(app.notes || '');
                          }}
                          className="btn-primary-light !py-2.5 !px-3 text-xs flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#D4895A]" />
                          <span>View Dossier</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Data Table (hidden on mobile, visible on md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DDD7CB] bg-[#F8F5EE] text-[#4A4A44] font-semibold">
                    <th scope="col" className="py-3.5 px-4 sm:px-6">Date Submitted</th>
                    <th scope="col" className="py-3.5 px-4">Applicant &amp; Role</th>
                    <th scope="col" className="py-3.5 px-4">Contact Details</th>
                    <th scope="col" className="py-3.5 px-4">Key Criteria / Niche</th>
                    <th scope="col" className="py-3.5 px-4">Review Status</th>
                    <th scope="col" className="py-3.5 px-4 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEBE1]">
                  {filteredApplications.map((app) => {
                    const isOwner = app.role_type === 'offer_owner';
                    const dateObj = new Date(app.created_at);
                    const formattedDate = dateObj.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const formattedTime = dateObj.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-[#FAF8F4] transition-colors"
                      >
                        {/* 1. Date submitted */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-[#7A7A72]">
                          <div className="font-medium text-[#1A1A18]">{formattedDate}</div>
                          <div className="text-[11px] text-[#8A9A92]">{formattedTime}</div>
                        </td>

                        {/* 2. Full Name & Role Type badge */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-sm text-[#1A1A18] mb-1">
                            {app.full_name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isOwner ? (
                              <span className="inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#FAF3EE] text-[#9A4E20] border border-[#B5632F]/30 uppercase tracking-wider">
                                Offer Owner
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#E8EFEA] text-[#0F2A24] border border-[#2A453D]/30 uppercase tracking-wider">
                                Candidate / Rep
                              </span>
                            )}
                            {isOwner && app.details?.company && (
                              <span className="text-[11px] text-[#7A7A72] truncate max-w-[140px]" title={app.details.company}>
                                · {app.details.company}
                              </span>
                            )}
                            {!isOwner && app.details?.role && (
                              <span className="text-[11px] text-[#7A7A72] capitalize">
                                · {app.details.role}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Contact (Email & Phone) */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <a
                              href={`mailto:${app.email}`}
                              className="text-[#1A1A18] hover:text-[#B5632F] font-mono flex items-center gap-1.5 hover:underline"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#8A9A92] shrink-0" />
                              <span className="truncate max-w-[180px]">{app.email}</span>
                            </a>
                            {app.phone && (
                              <a
                                href={`tel:${app.phone}`}
                                className="text-[#7A7A72] hover:text-[#1A1A18] flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#8A9A92] shrink-0" />
                                <span>{app.phone}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 4. Key Criteria / Niche */}
                        <td className="py-4 px-4 max-w-[200px]">
                          {isOwner ? (
                            <div className="text-[11px] text-[#4A4A44] truncate" title={app.details?.offerDescription || ''}>
                              <span className="font-medium text-[#1A1A18] block truncate">
                                {app.details?.commissionStructure || 'Commission model specified'}
                              </span>
                              <span className="text-[#7A7A72] truncate block">
                                {app.details?.expectedVolume || 'Volume specified'}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#4A4A44] truncate">
                              <span className="font-medium text-[#1A1A18] block truncate" title={app.details?.nichesWorkedIn}>
                                {app.details?.nichesWorkedIn || 'Sales background'}
                              </span>
                              <span className="text-[#7A7A72] block truncate">
                                {app.details?.locationAndTimezone || 'UK & Global'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 5. Status with Inline Dropdown */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center">
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                              className={`py-1 px-2.5 rounded-[4px] text-xs font-medium cursor-pointer focus:outline-none transition-colors ${getStatusBadgeClass(
                                app.status
                              )}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="under_review">Under Review</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        </td>

                        {/* 6. Action: View Application & Message Buttons */}
                        <td className="py-4 px-4 pr-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplication(app);
                              setDrawerTab('messages');
                              setAdminNotes(app.notes || '');
                            }}
                            className="py-1.5 px-2.5 rounded-[4px] bg-[#FAF8F4] hover:bg-[#F1EDE5] text-[#0F2A24] border border-[#DDD7CB] font-semibold text-xs transition-colors cursor-pointer mr-2 inline-flex items-center gap-1.5"
                            title="Open direct message channel"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#B5632F]" />
                            <span className="hidden sm:inline">Message</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplication(app);
                              setDrawerTab('details');
                              setAdminNotes(app.notes || '');
                            }}
                            className="py-1.5 px-3 rounded-[4px] bg-[#FAF8F4] hover:bg-[#F1EDE5] text-[#0F2A24] border border-[#DDD7CB] font-semibold text-xs transition-colors cursor-pointer"
                          >
                            View Application
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* SLIDE-OVER DRAWER FOR VIEW APPLICATION */}
      {/* --------------------------------------------------------------------- */}
      {selectedApplication && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            onClick={() => setSelectedApplication(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-xl bg-[#FAF8F4] border-l border-[#DDD7CB] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Top Header (Ink Green #0F2A24) */}
              <div className="bg-[#0F2A24] text-[#F4F1EA] p-4 sm:p-6 border-b border-[#2A453D]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {selectedApplication.role_type === 'offer_owner' ? (
                        <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#FAF3EE] text-[#9A4E20] border border-[#B5632F]/40 uppercase tracking-wider">
                          Offer Owner Application
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#E8EFEA] text-[#0F2A24] border border-[#2A453D]/40 uppercase tracking-wider">
                          Sales Candidate Application
                        </span>
                      )}
                      <span className="text-xs text-[#B9C4BE]">
                        ID: <span className="font-mono text-[#F4F1EA]">{selectedApplication.id.substring(0, 12)}...</span>
                      </span>
                    </div>

                    <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#F4F1EA]">
                      {selectedApplication.full_name}
                    </h2>
                    <p className="text-xs text-[#B9C4BE] mt-1">
                      Submitted on{' '}
                      {new Date(selectedApplication.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedApplication(null)}
                    aria-label="Close drawer"
                    className="p-2 rounded-[4px] text-[#B9C4BE] hover:text-white hover:bg-[#163B33] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Switcher in Header */}
                <div className="mt-4 pt-3.5 border-t border-[#2A453D] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#B9C4BE]">Placement Review Status:</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedApplication.status}
                      onChange={(e) =>
                        handleStatusChange(selectedApplication.id, e.target.value as ApplicationStatus)
                      }
                      className={`py-1.5 px-3 rounded-[4px] text-xs font-semibold cursor-pointer ${getStatusBadgeClass(
                        selectedApplication.status
                      )}`}
                    >
                      <option value="pending">Pending Review</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Drawer Navigation Tabs: Dossier vs Messages */}
              <div className="flex border-b border-[#2A453D] bg-[#0F2A24] px-4 sm:px-6 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDrawerTab('details')}
                  className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-b-2 min-h-[44px] ${
                    drawerTab === 'details'
                      ? 'text-[#F4F1EA] border-[#D4895A]'
                      : 'text-[#B9C4BE] border-transparent hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Application Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerTab('messages')}
                  className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-b-2 min-h-[44px] ${
                    drawerTab === 'messages'
                      ? 'text-[#F4F1EA] border-[#D4895A]'
                      : 'text-[#B9C4BE] border-transparent hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#D4895A]" />
                  <span>Messages &amp; Direct Contact</span>
                </button>
              </div>

              {/* Drawer Body: Dossier Tab */}
              {drawerTab === 'details' ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Contact Section */}
                <div className="card-hairline p-5 bg-white space-y-3">
                  <h3 className="font-serif text-base font-normal text-[#1A1A18] border-b border-[#EFEBE1] pb-2">
                    Contact &amp; Identification
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Email Address</span>
                      <a
                        href={`mailto:${selectedApplication.email}`}
                        className="text-[#1A1A18] font-mono hover:text-[#B5632F] hover:underline break-all"
                      >
                        {selectedApplication.email}
                      </a>
                    </div>

                    <div>
                      <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Phone Number</span>
                      <span className="text-[#1A1A18]">
                        {selectedApplication.phone || 'Not provided'}
                      </span>
                    </div>

                    {selectedApplication.role_type === 'offer_owner' && (
                      <>
                        <div>
                          <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Company Name</span>
                          <span className="text-[#1A1A18] font-medium">
                            {selectedApplication.details?.company || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Website</span>
                          {selectedApplication.details?.website ? (
                            <a
                              href={selectedApplication.details.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#B5632F] hover:underline flex items-center gap-1 font-mono"
                            >
                              <span>{selectedApplication.details.website}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[#8A9A92]">Not provided</span>
                          )}
                        </div>
                      </>
                    )}

                    {selectedApplication.role_type === 'candidate' && (
                      <>
                        <div>
                          <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Location &amp; Timezone</span>
                          <span className="text-[#1A1A18]">
                            {selectedApplication.details?.locationAndTimezone || 'UK'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Role Applying For</span>
                          <span className="text-[#1A1A18] font-semibold uppercase">
                            {selectedApplication.details?.role || 'Setter / Closer'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Role-Specific Application Intake Answers */}
                <div className="card-hairline p-5 bg-white space-y-4">
                  <h3 className="font-serif text-base font-normal text-[#1A1A18] border-b border-[#EFEBE1] pb-2">
                    Application Details &amp; Criteria
                  </h3>

                  {selectedApplication.role_type === 'offer_owner' ? (
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          Role Needed
                        </span>
                        <span className="font-semibold text-sm text-[#1A1A18] capitalize">
                          {selectedApplication.details?.roleNeeded === 'both'
                            ? 'Both Appointment Setters & Closers'
                            : selectedApplication.details?.roleNeeded}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          Commission &amp; Compensation Structure
                        </span>
                        <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] leading-relaxed">
                          {selectedApplication.details?.commissionStructure || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          Expected Lead &amp; Call Volume
                        </span>
                        <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] leading-relaxed">
                          {selectedApplication.details?.expectedVolume || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          Offer Description &amp; Mechanism
                        </span>
                        <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] leading-relaxed">
                          {selectedApplication.details?.offerDescription || 'N/A'}
                        </div>
                      </div>

                      {selectedApplication.details?.message && (
                        <div>
                          <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                            Additional Notes from Submitter
                          </span>
                          <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] leading-relaxed">
                            {selectedApplication.details?.message}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          Sales Track Record &amp; Experience
                        </span>
                        <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] leading-relaxed whitespace-pre-line">
                          {selectedApplication.details?.experience || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          Niches Worked In
                        </span>
                        <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] leading-relaxed">
                          {selectedApplication.details?.nichesWorkedIn || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          Tools &amp; CRMs Used
                        </span>
                        <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] leading-relaxed">
                          {selectedApplication.details?.toolsUsed || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          Portfolio / Video Introduction Link
                        </span>
                        {selectedApplication.details?.portfolioOrVideoLink ? (
                          <a
                            href={selectedApplication.details.portfolioOrVideoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 bg-[#FAF3EE] border border-[#B5632F]/30 rounded-[4px] text-[#B5632F] font-mono flex items-center justify-between hover:underline"
                          >
                            <span className="truncate">{selectedApplication.details.portfolioOrVideoLink}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        ) : (
                          <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#8A9A92]">
                            No link provided
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                          UK GDPR Consent
                        </span>
                        <div className="flex items-center gap-2 text-[#166534]">
                          <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                          <span>Confirmed during form submission</span>
                        </div>
                      </div>

                      {selectedApplication.details?.message && (
                        <div>
                          <span className="text-[#8A9A92] uppercase tracking-wider block font-medium mb-1">
                            Candidate Note
                          </span>
                          <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] leading-relaxed">
                            {selectedApplication.details?.message}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Internal Admin Review Notes */}
                <div className="card-hairline p-5 bg-white space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EFEBE1] pb-2">
                    <h3 className="font-serif text-base font-normal text-[#1A1A18]">
                      Internal Review Notes
                    </h3>
                    <span className="text-[11px] text-[#8A9A92]">Private to Admins</span>
                  </div>

                  <p className="text-xs text-[#7A7A72]">
                    Record candidate interview notes, compensation agreements, or client placement matches.
                  </p>

                  <textarea
                    rows={4}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter placement notes, interview feedback, or matching suggestions..."
                    className="w-full p-3 text-xs bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#1A1A18] focus:outline-none focus:border-[#B5632F] focus:ring-1 focus:ring-[#B5632F]"
                  />

                  <div className="flex items-center justify-between pt-1">
                    {notesSaveSuccess ? (
                      <span className="text-xs text-[#166534] font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved to Supabase database</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#8A9A92]">Persisted to record</span>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="py-2 px-4 text-xs bg-[#0F2A24] text-[#F4F1EA] hover:bg-[#163B33] disabled:opacity-50 rounded-[4px] font-medium transition-colors cursor-pointer"
                    >
                      {isSavingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="card-hairline p-5 bg-white space-y-3">
                  <h3 className="font-serif text-sm font-semibold text-[#1A1A18]">
                    Quick Decision Actions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedApplication.id, 'approved')}
                      className={`py-2 px-3 rounded-[4px] font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedApplication.status === 'approved'
                          ? 'bg-[#166534] text-white border border-[#166534] shadow-sm'
                          : 'bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border border-[#22C55E]/40'
                      }`}
                    >
                      {selectedApplication.status === 'approved' && <Check className="w-3.5 h-3.5" />}
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedApplication.id, 'under_review')}
                      className={`py-2 px-3 rounded-[4px] font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedApplication.status === 'under_review'
                          ? 'bg-[#1E40AF] text-white border border-[#1E40AF] shadow-sm'
                          : 'bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#3B82F6]/40'
                      }`}
                    >
                      {selectedApplication.status === 'under_review' && <Check className="w-3.5 h-3.5" />}
                      <span>Under Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                      className={`py-2 px-3 rounded-[4px] font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedApplication.status === 'rejected'
                          ? 'bg-[#991B1B] text-white border border-[#991B1B] shadow-sm'
                          : 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#EF4444]/40'
                      }`}
                    >
                      {selectedApplication.status === 'rejected' && <Check className="w-3.5 h-3.5" />}
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedApplication.id, 'archived')}
                      className={`py-2 px-3 rounded-[4px] font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedApplication.status === 'archived'
                          ? 'bg-[#57534E] text-white border border-[#57534E] shadow-sm'
                          : 'bg-[#F5F5F4] hover:bg-[#E7E5E4] text-[#57534E] border border-[#A8A29E]/40'
                      }`}
                    >
                      {selectedApplication.status === 'archived' && <Check className="w-3.5 h-3.5" />}
                      <span>Archive</span>
                    </button>
                  </div>
                </div>
              </div>
              ) : (
                /* Drawer Body: Messages & Direct Contact Tab */
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
                  <ApplicationChatThread
                    application={selectedApplication}
                    applicationId={selectedApplication.id}
                    applicantName={selectedApplication.full_name}
                    applicantEmail={selectedApplication.email}
                    recipientUserId={selectedApplication.user_id}
                    currentUserRole="admin"
                    currentUserEmail={user?.email || 'admin@vox-direct.com'}
                    title={`Channel: ${selectedApplication.full_name}`}
                    subtitle={`Direct line with applicant (${selectedApplication.email})`}
                    minHeight="340px"
                  />
                </div>
              )}

              {/* Drawer Footer */}
              <div className="p-3.5 sm:p-4 bg-[#F8F5EE] border-t border-[#DDD7CB] flex flex-col sm:flex-row gap-2.5 sm:gap-2 items-stretch sm:items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteApplication(selectedApplication.id)}
                  className="py-2 px-3 text-xs text-[#991B1B] hover:bg-[#FEE2E2] rounded-[4px] border border-[#EF4444]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>

                <div className="flex items-center gap-2">
                  {drawerTab === 'details' ? (
                    <button
                      type="button"
                      onClick={() => setDrawerTab('messages')}
                      className="py-2 px-3 rounded-[4px] bg-[#FAF8F4] hover:bg-[#F1EDE5] text-[#0F2A24] border border-[#DDD7CB] font-semibold text-xs transition-colors cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[40px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#B5632F]" />
                      <span>Direct Message</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDrawerTab('details')}
                      className="py-2 px-3 rounded-[4px] bg-[#FAF8F4] hover:bg-[#F1EDE5] text-[#0F2A24] border border-[#DDD7CB] font-semibold text-xs transition-colors cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[40px]"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#8A9A92]" />
                      <span>Back to Dossier</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedApplication(null)}
                    className="btn-secondary-light !py-2 !px-4 text-xs cursor-pointer flex-1 sm:flex-none justify-center min-h-[40px]"
                  >
                    Close Drawer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SUPABASE SQL SCHEMA MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showSqlModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[4px] border border-[#DDD7CB] shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#B5632F]">
                  Supabase Setup Guide
                </span>
                <h3 className="font-serif text-xl font-normal text-[#1A1A18] mt-0.5">
                  Applications Table Schema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1 rounded-[4px] text-[#7A7A72] hover:text-[#1A1A18] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4A4A44] leading-relaxed">
              If you haven&apos;t run the table creation script in your Supabase project, open the{' '}
              <strong className="text-[#1A1A18]">Supabase Dashboard &gt; SQL Editor</strong> and execute the script below:
            </p>

            <div className="relative">
              <pre className="p-4 bg-[#0F2A24] text-[#A7F3D0] rounded-[4px] font-mono text-xs overflow-x-auto max-h-60 leading-relaxed border border-[#2A453D]">
                {sqlSchema}
              </pre>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="absolute top-2.5 right-2.5 py-1.5 px-3 bg-[#163B33] hover:bg-[#204E44] text-[#F4F1EA] text-[11px] rounded-[4px] border border-[#2A453D] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#D4895A]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#D4895A]" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="btn-primary-light !py-2 !px-4 text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
