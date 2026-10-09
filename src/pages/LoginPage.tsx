import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { PageId } from '../types';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: PageId, redirectUrl?: string) => void;
  redirectTarget?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, redirectTarget }) => {
  const { user, signInWithPassword, signInWithMagicLink, isSupabaseConfigured } = useAuth();

  const [authMethod, setAuthMethod] = useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Determine redirect URL from query string or props
  const getDestination = (): string => {
    if (redirectTarget) return redirectTarget;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) return redirect;
    }
    return '/dashboard';
  };

  // If user is already logged in, redirect them to destination
  useEffect(() => {
    if (user) {
      const destination = getDestination();
      if (destination.startsWith('/offer-owners')) {
        onNavigate('offer-owners');
      } else if (destination.startsWith('/offer-seekers') || destination.startsWith('/apply')) {
        onNavigate('offer-seekers');
      } else {
        onNavigate('dashboard');
      }
    }
  }, [user]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInWithPassword(email.trim(), password);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        // Redirection is handled by the useEffect or immediate route navigation
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
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address to receive a magic link.');
      return;
    }

    setIsSubmitting(true);
    try {
      const destination = getDestination();
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${destination}`
        : undefined;

      const res = await signInWithMagicLink(email.trim(), redirectUrl);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to dispatch magic link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRedirect = getDestination();
  const isGatedFormRedirect = currentRedirect.includes('offer-owners') || currentRedirect.includes('offer-seekers');

  return (
    <div className="bg-[#FAF8F4] min-h-[calc(100vh-80px)] py-12 sm:py-16">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        {/* Banner if redirected from a protected page */}
        {isGatedFormRedirect && (
          <div className="mb-6 rounded border border-[#B5632F]/30 bg-[#F5EBE1] p-4 text-xs text-[#9B5325] flex items-start gap-2.5">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#B5632F]" />
            <div>
              <strong className="font-semibold text-[#1A1A18] block mb-0.5">Authentication Required</strong>
              Please sign in or create an account to access our intake and placement application forms.
            </div>
          </div>
        )}

        <div className="card-hairline p-5 sm:p-9 bg-white">
          {/* Header */}
          <div className="border-b border-[#DDD7CB] pb-5 mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-2">
              <span className="w-3 h-px bg-[#B5632F]" aria-hidden="true" />
              <span>Vox Direct Portal</span>
              <span className="w-3 h-px bg-[#B5632F]" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1A1A18] tracking-tight">
              Sign In to Vox Direct
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#4A4A44] leading-relaxed">
              Access your candidate application or offer owner hiring desk.
            </p>
          </div>

          {/* Method Switcher: Password vs Magic Link */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1EDE5] rounded mb-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setErrorMessage('');
              }}
              className={`py-2 px-3 rounded transition-colors text-center cursor-pointer ${
                authMethod === 'password'
                  ? 'bg-white text-[#1A1A18] font-semibold shadow-xs'
                  : 'text-[#4A4A44] hover:text-[#1A1A18]'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('magic-link');
                setErrorMessage('');
              }}
              className={`py-2 px-3 rounded transition-colors text-center cursor-pointer ${
                authMethod === 'magic-link'
                  ? 'bg-white text-[#1A1A18] font-semibold shadow-xs'
                  : 'text-[#4A4A44] hover:text-[#1A1A18]'
              }`}
            >
              Magic Link
            </button>
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

          {/* Magic link sent success notice */}
          {magicLinkSent ? (
            <div className="border border-[#DDD7CB] bg-[#F1EDE5] p-6 text-center space-y-3 rounded">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-[#0F2A24] text-[#F4F1EA]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-lg font-medium text-[#1A1A18]">
                Magic Link Dispatched
              </h2>
              <p className="text-xs text-[#4A4A44] leading-relaxed">
                We sent a secure one-click sign-in link to{' '}
                <strong className="text-[#1A1A18]">{email}</strong>. Check your inbox to continue.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail('');
                }}
                className="btn-secondary-light !py-2 !px-4 text-xs mt-2"
              >
                Use a different email
              </button>
            </div>
          ) : authMethod === 'password' ? (
            /* Email & Password Form */
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="login-email"
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('magic-link')}
                    className="text-xs text-[#B5632F] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded border border-[#DDD7CB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 focus:outline-none focus:border-[#B5632F]"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-light w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Magic Link Form */
            <form onSubmit={handleMagicLinkSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="magic-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5"
                >
                  Work Email Address
                </label>
                <div className="relative">
                  <input
                    id="magic-email"
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
                <p className="mt-1.5 text-xs text-[#8A9A92]">
                  We will email you a password-free sign-in link with instant authentication.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-light w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-[#D4895A]" />
                  {isSubmitting ? 'Sending Link...' : 'Send Magic Link'}
                </button>
              </div>
            </form>
          )}

          {/* Footer note & Signup link */}
          <div className="mt-6 pt-5 border-t border-[#DDD7CB] text-center text-xs text-[#4A4A44]">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="text-[#B5632F] font-semibold hover:underline cursor-pointer ml-1"
            >
              Create Account with Role
            </button>
          </div>
        </div>

        {/* Configuration notice for administrators / developers */}
        <div className="mt-6 text-center text-[11px] text-[#8A9A92] leading-relaxed">
          {isSupabaseConfigured ? (
            <span>Connected to Supabase Authentication backend</span>
          ) : (
            <span>
              Client authentication active · To connect live Supabase keys, provide <code className="text-[#1A1A18]">VITE_SUPABASE_URL</code> &amp; <code className="text-[#1A1A18]">VITE_SUPABASE_ANON_KEY</code> in environment.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
