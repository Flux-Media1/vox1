import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Briefcase, Target, ShieldCheck } from 'lucide-react';
import { PageId, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface SignUpPageProps {
  onNavigate: (page: PageId, redirectUrl?: string) => void;
  redirectTarget?: string;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate, redirectTarget }) => {
  const { signUp, isSupabaseConfigured } = useAuth();

  const [role, setRole] = useState<UserRole>('seeker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  // Determine redirect target
  const getDestination = (): string => {
    if (redirectTarget) return redirectTarget;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) return redirect;
    }
    // Default to the appropriate form based on their selected role
    return role === 'owner' ? '/offer-owners' : '/offer-seekers';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your work or personal email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please create a password for your account.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signUp(email.trim(), password, role, fullName.trim());
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.confirmationSent) {
        setConfirmationSent(true);
      } else {
        // Successful signup & session created!
        const dest = getDestination();
        if (dest.startsWith('/offer-owners')) {
          onNavigate('offer-owners');
        } else if (dest.startsWith('/offer-seekers') || dest.startsWith('/apply')) {
          onNavigate('offer-seekers');
        } else {
          onNavigate('dashboard');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to register account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F4] min-h-[calc(100vh-80px)] py-12 sm:py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <div className="card-hairline p-7 sm:p-9 bg-white">
          {/* Header */}
          <div className="border-b border-[#DDD7CB] pb-5 mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-2">
              <span className="w-3 h-px bg-[#B5632F]" aria-hidden="true" />
              <span>Create Account</span>
              <span className="w-3 h-px bg-[#B5632F]" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1A1A18] tracking-tight">
              Join Vox Direct
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#4A4A44] leading-relaxed">
              Register as an offer owner hiring talent, or a setter / closer seeking verified placements.
            </p>
          </div>

          {/* Error Banner styled in muted rust/copper */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 rounded border border-[#B5632F]/40 bg-[#FAF3EE] p-3.5 text-xs text-[#9B5325] flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B5632F]" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Confirmation Notice */}
          {confirmationSent ? (
            <div className="border border-[#DDD7CB] bg-[#F1EDE5] p-6 text-center space-y-3 rounded">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-[#0F2A24] text-[#F4F1EA]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-lg font-medium text-[#1A1A18]">
                Check Your Email
              </h2>
              <p className="text-xs text-[#4A4A44] leading-relaxed">
                A verification link has been sent to <strong className="text-[#1A1A18]">{email}</strong>. Once confirmed, you can sign in to access your intake dashboard.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="btn-primary-light !py-2.5 !px-5 text-xs mt-2"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Role Selection: Required by User Brief */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-2">
                  Select Your Profile Role <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Role Option 1: Offer Owner */}
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`text-left p-3.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                      role === 'owner'
                        ? 'border-[#B5632F] bg-[#FAF3EE] ring-1 ring-[#B5632F]'
                        : 'border-[#DDD7CB] bg-[#FAF8F4] hover:border-stone-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Briefcase className={`w-4 h-4 ${role === 'owner' ? 'text-[#B5632F]' : 'text-stone-500'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          role === 'owner' ? 'bg-[#B5632F] text-white' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Employer
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-[#1A1A18]">
                        Offer Owner
                      </div>
                      <p className="text-[11px] text-[#4A4A44] mt-1 leading-snug">
                        Looking for talent to staff setters or closers on an offer.
                      </p>
                    </div>
                  </button>

                  {/* Role Option 2: Setter / Closer */}
                  <button
                    type="button"
                    onClick={() => setRole('seeker')}
                    className={`text-left p-3.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                      role === 'seeker'
                        ? 'border-[#B5632F] bg-[#FAF3EE] ring-1 ring-[#B5632F]'
                        : 'border-[#DDD7CB] bg-[#FAF8F4] hover:border-stone-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Target className={`w-4 h-4 ${role === 'seeker' ? 'text-[#B5632F]' : 'text-stone-500'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          role === 'seeker' ? 'bg-[#B5632F] text-white' : 'bg-stone-200 text-stone-600'
                        }`}>
                          Sales Rep
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-[#1A1A18]">
                        Setter / Closer
                      </div>
                      <p className="text-[11px] text-[#4A4A44] mt-1 leading-snug">
                        Seeking placement with verified high-ticket offers.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. David Harrison"
                    className="w-full rounded border border-[#DDD7CB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 focus:outline-none focus:border-[#B5632F]"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5"
                >
                  Work or Contact Email <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. david@scaleagency.co.uk"
                    required
                    className="w-full rounded border border-[#DDD7CB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 focus:outline-none focus:border-[#B5632F]"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5"
                >
                  Password (min 6 characters) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded border border-[#DDD7CB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 focus:outline-none focus:border-[#B5632F]"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Legal Notice */}
              <p className="text-[11px] text-[#8A9A92] leading-relaxed pt-1">
                By creating an account, you acknowledge that your information is stored in compliance with UK GDPR and our{' '}
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('privacy');
                  }}
                  className="text-[#B5632F] underline hover:text-[#9B5325]"
                >
                  Privacy Policy
                </a>.
              </p>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-light w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account & Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Footer note & Sign in link */}
          <div className="mt-6 pt-5 border-t border-[#DDD7CB] text-center text-xs text-[#4A4A44]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-[#B5632F] font-semibold hover:underline cursor-pointer ml-1"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Informative footer note */}
        <div className="mt-6 text-center text-[11px] text-[#8A9A92] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B5632F]" />
          <span>No placement fees charged to candidates finding work.</span>
        </div>
      </div>
    </div>
  );
};
