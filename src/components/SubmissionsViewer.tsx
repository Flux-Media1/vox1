import React, { useState, useEffect } from 'react';
import { X, Trash2, Download, Copy, Check, Mail, Send, CheckCircle2 } from 'lucide-react';
import { submissionService } from '../services/submissionService';
import { OfferOwnerSubmission, OfferSeekerSubmission, ContactSubmission } from '../types';
import { siteConfig } from '../data/content';

interface SubmissionsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SentEmailRecord {
  id: string;
  timestamp: string;
  to: string;
  recipientType?: 'submitter' | 'admin';
  from: string;
  subject: string;
  type: string;
  html: string;
  text: string;
  status: string;
  provider: string;
}

export const SubmissionsViewer: React.FC<SubmissionsViewerProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'emails' | 'owners' | 'seekers' | 'contact'>('emails');
  const [copied, setCopied] = useState(false);
  const [emailsHistory, setEmailsHistory] = useState<SentEmailRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/sent-emails')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.history)) {
            setEmailsHistory(data.history);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const owners: OfferOwnerSubmission[] = submissionService.getOfferOwners();
  const seekers: OfferSeekerSubmission[] = submissionService.getOfferSeekers();
  const contacts: ContactSubmission[] = submissionService.getContactMessages();

  const handleCopyJSON = () => {
    const payload = {
      notificationEmail: siteConfig.notificationEmail,
      offerOwners: owners,
      offerSeekers: seekers,
      contactMessages: contacts,
      emailsSent: emailsHistory,
      exportedAt: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const payload = {
      notificationEmail: siteConfig.notificationEmail,
      offerOwners: owners,
      offerSeekers: seekers,
      contactMessages: contacts,
      emailsSent: emailsHistory,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vox-direct-submissions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Clear all local test submissions?')) {
      submissionService.clearAll();
      setTab('emails');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Form Submissions & Email Logs</h3>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                To: {siteConfig.notificationEmail}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every form submission is automatically formatted and dispatched to your email address.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJSON}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setTab('emails')}
            className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors cursor-pointer ${
              tab === 'emails'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispatched Emails ({emailsHistory.length})
          </button>
          <button
            onClick={() => setTab('owners')}
            className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors cursor-pointer ${
              tab === 'owners'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Offer Owners ({owners.length})
          </button>
          <button
            onClick={() => setTab('seekers')}
            className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors cursor-pointer ${
              tab === 'seekers'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Offer Seekers ({seekers.length})
          </button>
          <button
            onClick={() => setTab('contact')}
            className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors cursor-pointer ${
              tab === 'contact'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Contact Enquiries ({contacts.length})
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'emails' && (
            <div>
              {emailsHistory.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Mail className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No email dispatches recorded yet.</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Fill in any form on the Offer Owners, Offer Seekers, or Contact page. It will immediately generate and dispatch an email to <strong className="text-slate-700">{siteConfig.notificationEmail}</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailsHistory.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1 ${
                              item.recipientType === 'submitter'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              <CheckCircle2 className="h-3 w-3" />
                              {item.recipientType === 'submitter' ? 'To Submitter:' : 'To Agency Admin:'} {item.to}
                            </span>
                            <span className="text-xs text-slate-400 capitalize">
                              ({item.type.replace('_', ' ')})
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 text-sm mt-1">{item.subject}</h4>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleString('en-GB')}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div
                          className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-800"
                          dangerouslySetInnerHTML={{ __html: item.html }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'owners' && (
            <div>
              {owners.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No offer owner submissions recorded yet. Fill in the form on the Offer Owners page to test.
                </div>
              ) : (
                <div className="space-y-4">
                  {owners.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{item.fullName} · {item.company}</h4>
                          <p className="text-xs text-slate-500">{item.email} · {item.phone}</p>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                        <div>
                          <strong className="text-slate-900">Role Needed:</strong> {item.roleNeeded}
                        </div>
                        <div>
                          <strong className="text-slate-900">Website:</strong> {item.website || 'N/A'}
                        </div>
                        <div>
                          <strong className="text-slate-900">Commission Structure:</strong> {item.commissionStructure}
                        </div>
                        <div>
                          <strong className="text-slate-900">Lead Volume:</strong> {item.expectedVolume}
                        </div>
                        <div className="md:col-span-2">
                          <strong className="text-slate-900">Offer Description:</strong>
                          <p className="mt-0.5 text-slate-600 whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100">{item.offerDescription}</p>
                        </div>
                        {item.message && (
                          <div className="md:col-span-2">
                            <strong className="text-slate-900">Additional Message:</strong>
                            <p className="mt-0.5 text-slate-600 whitespace-pre-wrap">{item.message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'seekers' && (
            <div>
              {seekers.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No seeker applications recorded yet. Fill in the form on the Offer Seekers page to test.
                </div>
              ) : (
                <div className="space-y-4">
                  {seekers.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{item.fullName}</h4>
                          <p className="text-xs text-slate-500">{item.email} · {item.phone} · {item.locationAndTimezone}</p>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                        <div>
                          <strong className="text-slate-900">Role:</strong> {item.role}
                        </div>
                        <div>
                          <strong className="text-slate-900">Experience:</strong> {item.experience}
                        </div>
                        <div>
                          <strong className="text-slate-900">Niches Worked In:</strong> {item.nichesWorkedIn}
                        </div>
                        <div>
                          <strong className="text-slate-900">Tools:</strong> {item.toolsUsed}
                        </div>
                        <div className="md:col-span-2">
                          <strong className="text-slate-900">LinkedIn / Video Intro:</strong>{' '}
                          <a href={item.portfolioOrVideoLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            {item.portfolioOrVideoLink}
                          </a>
                        </div>
                        {item.message && (
                          <div className="md:col-span-2">
                            <strong className="text-slate-900">Message:</strong>
                            <p className="mt-0.5 text-slate-600 whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100">{item.message}</p>
                          </div>
                        )}
                        <div className="md:col-span-2 text-slate-500 text-[11px]">
                          GDPR Consent: {item.gdprConsent ? 'Granted' : 'No'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'contact' && (
            <div>
              {contacts.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No contact submissions yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{item.fullName}</h4>
                          <p className="text-xs text-slate-500">{item.email} {item.subject ? `· ${item.subject}` : ''}</p>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 p-2.5 rounded border border-slate-100">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Send className="h-4 w-4 text-blue-600" />
            <span>Target notification email: <strong>{siteConfig.notificationEmail}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
