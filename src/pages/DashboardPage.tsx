import React, { useState, useEffect } from 'react';
import { PageId, UserRole, ApplicationRecord, ApplicationStatus, ApplicationRoleType } from '../types';
import { useAuth } from '../context/AuthContext';
import { applicationsService, isUUID } from '../services/applicationsService';
import { messagesService } from '../services/messagesService';
import { ApplicationChatThread } from '../components/ApplicationChatThread';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Building2, 
  Target, 
  LogOut, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Shield,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, signOut, updateUserProfile } = useAuth();
  const [userApplications, setUserApplications] = useState<ApplicationRecord[]>([]);
  const [activeChatAppId, setActiveChatAppId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUnreadCount = () => {
    if (user) {
      const count = messagesService.getUnreadCountForRecipient(
        user.id || user.email,
        'applicant'
      );
      setUnreadCount(count);
    }
  };

  useEffect(() => {
    if (!user) return;

    const userEmail = (user.email || '').trim().toLowerCase();
    const userId = user.id ? user.id.toLowerCase() : null;

    // 1. Initial cached state
    const cachedRecords = applicationsService.getUserApplications(user.id || user.email);
    setUserApplications(cachedRecords);
    if (cachedRecords.length > 0) {
      setActiveChatAppId((prev) => prev || cachedRecords[0].id);
    }
    refreshUnreadCount();

    // 2. Fetch latest status from Supabase table
    const fetchLatestApplications = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          let query = supabase
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });

          if (user.id && isUUID(user.id)) {
            query = query.or(`user_id.eq.${user.id},email.ilike.${userEmail}`);
          } else if (userEmail) {
            query = query.ilike('email', userEmail);
          }

          const { data, error } = await query;
          if (!error && Array.isArray(data)) {
            const mapped: ApplicationRecord[] = data
              .filter((row: any) => !String(row.id).startsWith('app_seed_'))
              .map((row: any) => ({
                id: String(row.id),
                user_id: row.user_id || null,
                role_type: (row.role_type as ApplicationRoleType) || 'candidate',
                full_name: row.full_name || user.fullName || 'Anonymous Applicant',
                email: row.email || userEmail,
                phone: row.phone || row.details?.phone || '',
                details: typeof row.details === 'object' && row.details !== null ? row.details : {},
                status: ((row.status || 'pending').toLowerCase() as ApplicationStatus),
                notes: row.notes || '',
                created_at: row.created_at || new Date().toISOString(),
                updated_at: row.updated_at || undefined,
              }));

            if (mapped.length > 0) {
              setUserApplications(mapped);
              setActiveChatAppId((prev) => prev || mapped[0].id);

              // Merge into local cache
              try {
                const currentCache = applicationsService.getLocalCache();
                const mappedIds = new Set(mapped.map((m) => m.id));
                const remaining = currentCache.filter((c) => !mappedIds.has(c.id));
                applicationsService.saveLocalCache([...mapped, ...remaining]);
              } catch {
                // ignore cache write error
              }
            }
          }
        } catch (fetchErr) {
          console.warn('Notice fetching candidate applications:', fetchErr);
        }
      }
    };

    fetchLatestApplications();

    // 3. Supabase Realtime subscription: Listen for UPDATE & INSERT on public.applications
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      const channelIdentifier = `candidate_applications_${userId || userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      channel = supabase
        .channel(channelIdentifier)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for UPDATE and INSERT
            schema: 'public',
            table: 'applications',
          },
          (payload) => {
            const eventType = payload.eventType;
            if ((eventType === 'UPDATE' || eventType === 'INSERT') && payload.new) {
              const row = payload.new as any;
              if (String(row.id).startsWith('app_seed_')) return;

              const rowUserId = row.user_id ? String(row.user_id).toLowerCase() : null;
              const rowEmail = row.email ? String(row.email).trim().toLowerCase() : '';

              const isMine =
                (userId && rowUserId === userId) ||
                (userEmail && rowEmail === userEmail);

              const updatedRecord: ApplicationRecord = {
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

              // Immediately update local React state so candidate sees the new status in real-time
              setUserApplications((prev) => {
                const exists = prev.some((a) => a.id === updatedRecord.id);
                if (exists) {
                  return prev.map((a) => (a.id === updatedRecord.id ? updatedRecord : a));
                }
                if (isMine) {
                  return [updatedRecord, ...prev];
                }
                return prev;
              });

              if (isMine) {
                setActiveChatAppId((prev) => prev || updatedRecord.id);
              }

              // Keep local cache synced
              try {
                const currentCache = applicationsService.getLocalCache();
                let newCache: ApplicationRecord[];
                if (eventType === 'INSERT') {
                  newCache = [updatedRecord, ...currentCache.filter((c) => c.id !== updatedRecord.id)];
                } else {
                  newCache = currentCache.map((c) => (c.id === updatedRecord.id ? updatedRecord : c));
                  if (!newCache.some((c) => c.id === updatedRecord.id) && isMine) {
                    newCache.unshift(updatedRecord);
                  }
                }
                applicationsService.saveLocalCache(newCache);
              } catch {
                // ignore
              }
            }
          }
        )
        .subscribe();
    }

    const handleMessagesUpdate = () => {
      refreshUnreadCount();
    };

    window.addEventListener('vox_direct_messages_updated', handleMessagesUpdate);

    // Clean up channel and event listener
    return () => {
      window.removeEventListener('vox_direct_messages_updated', handleMessagesUpdate);
      if (channel && supabase) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, [user]);

  if (!user) {
    return null;
  }

  const isOwner = user.role === 'owner';

  const handleRoleToggle = (newRole: UserRole) => {
    updateUserProfile({ role: newRole });
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#F59E0B]/40">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#3B82F6]/40">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Under Review</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#F0FDF4] text-[#166534] border border-[#22C55E]/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved &amp; Matching</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#EF4444]/40">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Not Selected</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#F5F5F4] text-[#57534E] border border-[#A8A29E]/40">
            <span>Archived</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FAF8F4] min-h-[calc(100vh-80px)] pb-20">
      {/* Editorial Header */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-8 sm:py-14 border-b border-[#2A453D]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A] mb-2">
                <span className="w-4 h-px bg-[#D4895A]" aria-hidden="true" />
                <span>Client &amp; Candidate Portal</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#F4F1EA]">
                {user.fullName ? `Welcome back, ${user.fullName}` : 'Welcome to Vox Direct'}
              </h1>
              <p className="mt-2 text-xs sm:text-sm md:text-base text-[#B9C4BE] max-w-xl">
                Signed in as <span className="text-[#F4F1EA] font-mono break-all">{user.email}</span> ·{' '}
                <span className="text-[#D4895A] font-medium">
                  {isOwner ? 'Offer Owner Account' : 'Setter & Closer Candidate Account'}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('dashboard-messages-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="py-2.5 px-3.5 rounded-[4px] text-xs bg-[#B5632F] text-white hover:bg-[#9A4E20] border border-[#D4895A]/40 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm flex-1 sm:flex-none min-h-[42px]"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{unreadCount} New Message{unreadCount > 1 ? 's' : ''}</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="py-2.5 px-3.5 sm:px-4 rounded-[4px] text-xs bg-[#B5632F] text-white hover:bg-[#9A4E20] border border-[#D4895A]/40 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-1 sm:flex-none min-h-[42px]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  onNavigate('home');
                }}
                className="btn-secondary-dark !py-2.5 !px-3.5 sm:!px-4 text-xs flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none min-h-[42px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Notice Banner if user is admin */}
      {isAdmin && (
        <div className="bg-[#FAF3EE] border-b border-[#DDD7CB] py-3.5 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#9A4E20] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#B5632F]" />
              <span>
                <strong>Administrator Access:</strong> You have permissions to review all incoming intakes in the Admin Portal.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="font-bold text-[#B5632F] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Open Admin Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Status & Submissions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Submissions Status Card */}
              <div className="card-hairline p-7 sm:p-8 bg-white border-[#DDD7CB]">
                <div className="flex items-start justify-between gap-4 mb-5 border-b border-[#EFEBE1] pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#B5632F]">
                      Placement Records
                    </span>
                    <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mt-1">
                      Your Application Status
                    </h2>
                  </div>
                  <div className="p-2.5 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#0F2A24]">
                    <FileText className="w-5 h-5 stroke-[1.5]" />
                  </div>
                </div>

                {userApplications.length === 0 ? (
                  <div className="p-6 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-center space-y-3">
                    <p className="text-sm text-[#4A4A44]">
                      You have not submitted an active application or offer intake form yet.
                    </p>
                    <div className="pt-1">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => onNavigate('offer-owners')}
                          className="btn-primary-light text-xs !py-2.5 !px-5 inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>Submit Offer Intake Form</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigate('offer-seekers')}
                          className="btn-primary-light text-xs !py-2.5 !px-5 inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>Complete Placement Application</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userApplications.map((app) => (
                      <div
                        key={app.id}
                        className="p-5 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[#1A1A18]">
                                {app.role_type === 'offer_owner' ? 'Offer Intake Form' : 'Candidate Placement Application'}
                              </span>
                              <span className="text-[11px] text-[#8A9A92]">· ID {app.id}</span>
                            </div>
                            <div className="text-xs text-[#7A7A72] mt-0.5">
                              Submitted {new Date(app.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                          <div>{getStatusBadge(app.status)}</div>
                        </div>

                        {/* Status Explanation Box */}
                        <div className="text-xs text-[#4A4A44] pt-2 border-t border-[#E5E0D6] leading-relaxed">
                          {app.status === 'pending' && (
                            <p>
                              Your submission is queued for initial intake audit. A placement director verifies your pipeline metrics within 24 business hours.
                            </p>
                          )}
                          {app.status === 'under_review' && (
                            <p>
                              Our placement team is currently reviewing your profile criteria and checking our network for active matches.
                            </p>
                          )}
                          {app.status === 'approved' && (
                            <p className="text-[#166534] font-medium">
                              Your profile has been vetted and approved. We are actively introducing you to suitable parties.
                            </p>
                          )}
                          {app.status === 'rejected' && (
                            <p className="text-[#991B1B]">
                              Your profile was not selected for current placements at this time.
                            </p>
                          )}
                          {app.status === 'archived' && (
                            <p className="text-[#57534E]">
                              This placement intake record is currently archived.
                            </p>
                          )}
                        </div>

                        {/* Summary details */}
                        <div className="text-xs text-[#7A7A72] bg-white p-3 rounded-[4px] border border-[#E5E0D6] space-y-1">
                          {app.role_type === 'offer_owner' ? (
                            <>
                              <div><strong>Company:</strong> {app.details?.company || 'N/A'}</div>
                              <div><strong>Role Needed:</strong> {app.details?.roleNeeded || 'N/A'}</div>
                              <div><strong>Compensation:</strong> {app.details?.commissionStructure || 'N/A'}</div>
                            </>
                          ) : (
                            <>
                              <div><strong>Role:</strong> {app.details?.role || 'N/A'}</div>
                              <div><strong>Niches:</strong> {app.details?.nichesWorkedIn || 'N/A'}</div>
                              <div><strong>Location:</strong> {app.details?.locationAndTimezone || 'UK'}</div>
                            </>
                          )}
                        </div>

                        {/* Quick Message Action */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E0D6]">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatAppId(app.id);
                              const el = document.getElementById('dashboard-messages-section');
                              el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="btn-secondary-light !py-1.5 !px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#B5632F]" />
                            <span>Message Placement Team</span>
                          </button>
                          <span className="text-[11px] font-mono text-[#8A9A92]">Record ID: {app.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages from Vox Direct Placement Desk Section */}
              <div
                id="dashboard-messages-section"
                className="card-hairline p-7 sm:p-8 bg-white border-[#DDD7CB] space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFEBE1] pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B5632F] mb-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Direct Correspondence</span>
                    </div>
                    <h2 className="font-serif text-2xl font-normal text-[#1A1A18]">
                      Messages from Vox Direct
                    </h2>
                    <p className="text-xs text-[#7A7A72] mt-0.5">
                      Direct channel with our admissions directors regarding your placement status, requirements, and interviews.
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <span className="self-start sm:self-auto px-2.5 py-1 text-xs font-bold bg-[#B5632F] text-white rounded-[4px] shadow-sm">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>

                {userApplications.length === 0 ? (
                  <div className="p-6 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-center space-y-2">
                    <p className="font-serif text-sm text-[#1A1A18]">Direct Messaging Inactive</p>
                    <p className="text-xs text-[#7A7A72] max-w-md mx-auto leading-relaxed">
                      Submit an Offer Intake or Candidate Placement form above to initiate direct messaging with our placement directors.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userApplications.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-xs text-[#7A7A72] shrink-0 font-medium">Select Application:</span>
                        {userApplications.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setActiveChatAppId(app.id)}
                            className={`py-1 px-2.5 rounded-[4px] text-xs font-medium border transition-colors cursor-pointer ${
                              activeChatAppId === app.id
                                ? 'bg-[#0F2A24] text-[#F4F1EA] border-[#0F2A24]'
                                : 'bg-[#FAF8F4] text-[#4A4A44] border-[#DDD7CB] hover:bg-[#F1EDE5]'
                            }`}
                          >
                            {app.role_type === 'offer_owner' ? 'Offer Intake' : 'Candidate'} · {app.id.substring(0, 8)}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeChatAppId && (() => {
                      const activeApp = userApplications.find((a) => a.id === activeChatAppId);
                      return (
                        <div className="space-y-3">
                          {activeApp && activeApp.status === 'approved' && (
                            <div className="p-3 bg-[#F0FDF4] border border-[#22C55E]/40 rounded-[4px] flex items-center justify-between text-xs text-[#166534]">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                                <span>
                                  <strong>Application Approved:</strong> Direct candidate placement chat is unlocked. You can communicate in real time with our admissions desk.
                                </span>
                              </div>
                              <span className="font-semibold px-2 py-0.5 bg-[#DCFCE7] rounded-[4px] text-[11px] shrink-0">
                                Unlocked
                              </span>
                            </div>
                          )}
                          <ApplicationChatThread
                            application={activeApp}
                            applicationId={activeChatAppId}
                            applicantName={user.fullName || user.email}
                            applicantEmail={user.email}
                            recipientUserId="admin"
                            currentUserRole="applicant"
                            currentUserEmail={user.email}
                            title="Placement Team Direct Channel"
                            subtitle={
                              activeApp?.status === 'approved'
                                ? 'Status: Approved · Direct line with Vox Direct Placement Team'
                                : 'Vox Direct Admissions & Placement Matching'
                            }
                            minHeight="340px"
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Action Drawer Card */}
              <div className="card-hairline p-7 sm:p-8 bg-white border-[#DDD7CB]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#B5632F]">
                      {isOwner ? 'Offer Owner Desk' : 'Candidate Placement Desk'}
                    </span>
                    <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mt-1">
                      {isOwner ? 'Hire Vetted Setters & Closers' : 'Your Placement Application'}
                    </h2>
                  </div>
                  <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px] text-[#0F2A24]">
                    {isOwner ? <Building2 className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                  </div>
                </div>

                <p className="text-sm text-[#4A4A44] leading-relaxed mb-6">
                  {isOwner
                    ? 'Submit your offer details, target deal size, expected lead volume, and commission model. Our placement team matches you with vetted appointment setters and closers.'
                    : 'Submit or review your candidate details, past experience, tracked closed volume, and target compensation. Free placement with verified UK & international offers.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => onNavigate('offer-owners')}
                      className="btn-primary-light flex items-center justify-center gap-2 text-sm py-3 px-6 cursor-pointer"
                    >
                      <span>Open Offer Intake Form</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate('offer-seekers')}
                      className="btn-primary-light flex items-center justify-center gap-2 text-sm py-3 px-6 cursor-pointer"
                    >
                      <span>Complete Placement Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="btn-secondary-light text-sm py-3 px-6 cursor-pointer"
                  >
                    Contact Placement Team
                  </button>
                </div>
              </div>

              {/* Status & Process Info */}
              <div className="card-hairline p-7 sm:p-8 bg-white space-y-5 border-[#DDD7CB]">
                <h3 className="font-serif text-xl font-normal text-[#1A1A18]">
                  How Placement Works
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px]">
                    <div className="font-mono text-xs text-[#B5632F] font-bold mb-1">STEP 01</div>
                    <div className="font-semibold text-sm text-[#1A1A18] mb-1">Intake Review</div>
                    <p className="text-xs text-[#4A4A44] leading-relaxed">
                      We audit requirements, sales volume, and compensation structures.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px]">
                    <div className="font-mono text-xs text-[#B5632F] font-bold mb-1">STEP 02</div>
                    <div className="font-semibold text-sm text-[#1A1A18] mb-1">Direct Match</div>
                    <p className="text-xs text-[#4A4A44] leading-relaxed">
                      We introduce vetted talent suited to offer complexity and timezones.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF8F4] border border-[#DDD7CB] rounded-[4px]">
                    <div className="font-mono text-xs text-[#B5632F] font-bold mb-1">STEP 03</div>
                    <div className="font-semibold text-sm text-[#1A1A18] mb-1">Deployment</div>
                    <p className="text-xs text-[#4A4A44] leading-relaxed">
                      Direct contract between offer owner and sales talent without candidate fees.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Account Info & Role Switcher */}
            <div className="space-y-6">
              {/* Account Card */}
              <div className="card-hairline p-6 bg-white space-y-4 border-[#DDD7CB]">
                <h3 className="font-serif text-lg font-normal text-[#1A1A18]">
                  Account Profile
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Email</span>
                    <span className="text-[#1A1A18] font-mono break-all text-sm">{user.email}</span>
                  </div>

                  {user.fullName && (
                    <div>
                      <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Name</span>
                      <span className="text-[#1A1A18] text-sm">{user.fullName}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Current Role</span>
                    <span className="inline-block px-2.5 py-1 bg-[#FAF3EE] text-[#B5632F] font-semibold rounded-[4px] text-xs mt-1 border border-[#B5632F]/20">
                      {isOwner ? 'Offer Owner' : 'Setter / Closer'}
                    </span>
                  </div>

                  {isAdmin && (
                    <div>
                      <span className="text-[#8A9A92] uppercase tracking-wider block font-medium">Privilege Level</span>
                      <span className="inline-block px-2.5 py-1 bg-[#0F2A24] text-[#F4F1EA] font-semibold rounded-[4px] text-xs mt-1 border border-[#2A453D]">
                        Portal Administrator
                      </span>
                    </div>
                  )}
                </div>

                {/* Role Switcher */}
                <div className="pt-4 border-t border-[#DDD7CB]">
                  <span className="text-xs font-semibold text-[#1A1A18] block mb-2">
                    Switch Your View:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleRoleToggle('owner')}
                      className={`p-2 rounded-[4px] border text-center transition-colors cursor-pointer ${
                        isOwner
                          ? 'border-[#B5632F] bg-[#FAF3EE] text-[#B5632F] font-bold'
                          : 'border-[#DDD7CB] bg-white text-[#4A4A44] hover:border-stone-400'
                      }`}
                    >
                      Offer Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleToggle('seeker')}
                      className={`p-2 rounded-[4px] border text-center transition-colors cursor-pointer ${
                        !isOwner
                          ? 'border-[#B5632F] bg-[#FAF3EE] text-[#B5632F] font-bold'
                          : 'border-[#DDD7CB] bg-white text-[#4A4A44] hover:border-stone-400'
                      }`}
                    >
                      Setter / Closer
                    </button>
                  </div>
                </div>
              </div>

              {/* Placement Standards Card */}
              <div className="card-hairline p-6 bg-white space-y-3 text-xs text-[#4A4A44] border-[#DDD7CB]">
                <div className="flex items-center gap-2 text-[#0F2A24] font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#B5632F]" />
                  <span>Trust &amp; Compliance</span>
                </div>
                <p className="leading-relaxed">
                  Vox Direct operates as an introductory placement agency under English law. We do not charge fees to candidates for finding them work.
                </p>
                <div className="pt-1 flex flex-col gap-1.5 font-medium">
                  <button
                    type="button"
                    onClick={() => onNavigate('privacy')}
                    className="text-left text-[#B5632F] hover:underline cursor-pointer"
                  >
                    View Privacy Policy &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('terms')}
                    className="text-left text-[#B5632F] hover:underline cursor-pointer"
                  >
                    View Website Terms &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
