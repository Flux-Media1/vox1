import React from 'react';
import { PageId, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Target, 
  Mail, 
  LogOut, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Clock, 
  HelpCircle 
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, signOut, updateUserProfile } = useAuth();

  if (!user) {
    return null;
  }

  const isOwner = user.role === 'owner';

  const handleRoleToggle = (newRole: UserRole) => {
    updateUserProfile({ role: newRole });
  };

  return (
    <div className="bg-[#FAF8F4] min-h-[calc(100vh-80px)]">
      {/* Editorial Header */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-14 sm:py-18 border-b border-[#2A453D]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A] mb-2">
                <span className="w-4 h-px bg-[#D4895A]" aria-hidden="true" />
                <span>Client &amp; Candidate Portal</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#F4F1EA]">
                {user.fullName ? `Welcome back, ${user.fullName}` : 'Welcome to Vox Direct'}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#B9C4BE] max-w-xl">
                Signed in as <span className="text-[#F4F1EA] font-mono">{user.email}</span> ·{' '}
                <span className="text-[#D4895A] font-medium">
                  {isOwner ? 'Offer Owner Account' : 'Setter & Closer Candidate Account'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  onNavigate('home');
                }}
                className="btn-secondary-dark !py-2.5 !px-4 text-xs flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Main Action & Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Primary Call-to-action Card */}
              <div className="card-hairline p-7 sm:p-8 bg-white">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#B5632F]">
                      {isOwner ? 'Offer Owner Desk' : 'Candidate Placement Desk'}
                    </span>
                    <h2 className="font-serif text-2xl font-medium text-[#1A1A18] mt-1">
                      {isOwner ? 'Hire Vetted Setters & Closers' : 'Your Placement Application'}
                    </h2>
                  </div>
                  <div className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded text-[#0F2A24]">
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
              <div className="card-hairline p-7 sm:p-8 bg-white space-y-5">
                <h3 className="font-serif text-xl font-medium text-[#1A1A18]">
                  How Placement Works
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-[#FAF8F4] border border-[#DDD7CB] rounded">
                    <div className="font-mono text-xs text-[#B5632F] font-bold mb-1">STEP 01</div>
                    <div className="font-semibold text-sm text-[#1A1A18] mb-1">Intake Review</div>
                    <p className="text-xs text-[#4A4A44] leading-relaxed">
                      We audit requirements, sales volume, and compensation structures.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF8F4] border border-[#DDD7CB] rounded">
                    <div className="font-mono text-xs text-[#B5632F] font-bold mb-1">STEP 02</div>
                    <div className="font-semibold text-sm text-[#1A1A18] mb-1">Direct Match</div>
                    <p className="text-xs text-[#4A4A44] leading-relaxed">
                      We introduce vetted talent suited to offer complexity and timezones.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF8F4] border border-[#DDD7CB] rounded">
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
              <div className="card-hairline p-6 bg-white space-y-4">
                <h3 className="font-serif text-lg font-medium text-[#1A1A18]">
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
                    <span className="inline-block px-2.5 py-1 bg-[#FAF3EE] text-[#B5632F] font-semibold rounded text-xs mt-1 border border-[#B5632F]/20">
                      {isOwner ? 'Offer Owner' : 'Setter / Closer'}
                    </span>
                  </div>
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
                      className={`p-2 rounded border text-center transition-colors cursor-pointer ${
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
                      className={`p-2 rounded border text-center transition-colors cursor-pointer ${
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
              <div className="card-hairline p-6 bg-white space-y-3 text-xs text-[#4A4A44]">
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
