/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vox Direct - UK Sales Placement Agency SPA
 * 
 * =========================================================================
 * ROUTE PROTECTION & AUTHENTICATION SPECIFICATION
 * =========================================================================
 * 
 * 1. PUBLIC ROUTES (Always accessible without authentication):
 *    - '/'             (Home page)
 *    - '/contact'      (General placement enquiries)
 *    - '/privacy'      (UK GDPR & Data Protection Act 2018 privacy policy)
 *    - '/terms'        (Website terms of service & English law terms)
 *    - '/login'        (Account authentication via password or magic link)
 *    - '/signup'       (Registration with role selection)
 * 
 * 2. PROTECTED / GATED ROUTES (Require active session):
 *    - '/offer-owners'   (Offer Owner intake form)
 *    - '/offer-seekers'  (Candidate & Closer application form)
 *    - '/apply'          (Alias for candidate application)
 *    - '/dashboard'      (Client & Candidate management portal)
 * 
 * 3. REDIRECT BEHAVIOUR:
 *    If an unauthenticated visitor attempts to access a protected route,
 *    their target path is preserved and they are redirected to:
 *      `/login?redirect=[target-path]`
 *    Upon successful login/registration, they are immediately redirected
 *    back to their original destination.
 * 
 * 4. SUPABASE CREDENTIALS SETUP:
 *    To connect live Supabase Authentication, set the following environment
 *    variables in your .env or Vercel project settings:
 *      VITE_SUPABASE_URL="https://[your-project-id].supabase.co"
 *      VITE_SUPABASE_ANON_KEY="[your-supabase-anon-key]"
 *    The app also includes a zero-config lightweight local auth fallback
 *    that works immediately for development and demonstration.
 */

import React, { useState, useEffect } from 'react';
import { PageId } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { OfferOwnersPage } from './pages/OfferOwnersPage';
import { OfferSeekersPage } from './pages/OfferSeekersPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const PAGE_META: Record<PageId, { title: string; description: string; path: string }> = {
  home: {
    title: 'Vox Direct · Sales Placement Agency | UK',
    description:
      'Vox Direct connects verified offer owners with vetted appointment setters and high-ticket closers across the United Kingdom.',
    path: '/',
  },
  'offer-owners': {
    title: 'Hire Vetted Setters & Closers · Vox Direct',
    description:
      'Scale your sales process with vetted, performance-driven appointment setters and closers matched to your offer and lead volume.',
    path: '/offer-owners',
  },
  'offer-seekers': {
    title: 'Apply for High-Ticket Sales Roles · Vox Direct',
    description:
      'Apply to be placed with verified high-ticket offers needing appointment setters and closers. Free placement service for UK and remote sales talent.',
    path: '/offer-seekers',
  },
  contact: {
    title: 'Contact Vox Direct · Sales Placement Desk',
    description:
      'Get in touch with the Vox Direct placement team for offer owner hiring requirements or sales candidate enquiries.',
    path: '/contact',
  },
  privacy: {
    title: 'Privacy Policy · Vox Direct',
    description:
      'Plain-English UK GDPR and Data Protection Act 2018 privacy policy for Vox Direct sales placement agency.',
    path: '/privacy',
  },
  terms: {
    title: 'Website Terms of Use · Vox Direct',
    description:
      'Website terms of use and service conditions for Vox Direct sales introduction and placement business.',
    path: '/terms',
  },
  login: {
    title: 'Sign In · Vox Direct Client & Candidate Portal',
    description:
      'Sign in to your Vox Direct portal to submit offer intake details or access candidate placement records.',
    path: '/login',
  },
  signup: {
    title: 'Create Account · Vox Direct Placement Agency',
    description:
      'Register as an offer owner or sales setter/closer candidate with Vox Direct sales placement platform.',
    path: '/signup',
  },
  dashboard: {
    title: 'Portal Dashboard · Vox Direct',
    description:
      'Internal intake and placement portal for verified offer owners and sales candidates.',
    path: '/dashboard',
  },
  '404': {
    title: 'Page Not Found · Vox Direct',
    description: 'The requested page could not be found on Vox Direct.',
    path: '/404',
  },
};

// Protected routes requiring authentication
const PROTECTED_PAGES: PageId[] = ['offer-owners', 'offer-seekers', 'dashboard'];

function getPageFromPath(pathname: string): PageId {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '') return 'home';
  if (clean === '/offer-owners') return 'offer-owners';
  if (clean === '/offer-seekers') return 'offer-seekers';
  if (clean === '/apply') return 'offer-seekers';
  if (clean === '/contact') return 'contact';
  if (clean === '/privacy') return 'privacy';
  if (clean === '/terms') return 'terms';
  if (clean === '/login') return 'login';
  if (clean === '/signup') return 'signup';
  if (clean === '/dashboard') return 'dashboard';
  return '404';
}

function MainApp() {
  const { user, isLoading } = useAuth();

  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    if (typeof window !== 'undefined') {
      return getPageFromPath(window.location.pathname);
    }
    return 'home';
  });

  const [redirectTarget, setRedirectTarget] = useState<string>('');

  // Handle route protection upon auth ready or URL changes
  useEffect(() => {
    if (isLoading) return;

    const path = window.location.pathname;
    const resolvedPage = getPageFromPath(path);

    // If attempting to access a protected page while not authenticated
    if (PROTECTED_PAGES.includes(resolvedPage) && !user) {
      const destination = PAGE_META[resolvedPage]?.path || path;
      setRedirectTarget(destination);
      setCurrentPage('login');
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', `/login?redirect=${encodeURIComponent(destination)}`);
      }
    }
  }, [user, isLoading]);

  // Listen to browser forward/backward navigation
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      if (PROTECTED_PAGES.includes(page) && !user && !isLoading) {
        setRedirectTarget(PAGE_META[page]?.path || window.location.pathname);
        setCurrentPage('login');
      } else {
        setCurrentPage(page);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, isLoading]);

  // Sync document title and meta description dynamically
  useEffect(() => {
    const meta = PAGE_META[currentPage] || PAGE_META.home;
    document.title = meta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', meta.description);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', meta.title);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', meta.description);
    }
  }, [currentPage]);

  const navigateTo = (page: PageId, redirectUrl?: string) => {
    // Check if the requested route is gated behind authentication
    if (PROTECTED_PAGES.includes(page) && !user) {
      const targetPath = redirectUrl || PAGE_META[page]?.path || '/';
      setRedirectTarget(targetPath);
      setCurrentPage('login');
      window.history.pushState(null, '', `/login?redirect=${encodeURIComponent(targetPath)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentPage(page);
    const targetPath = PAGE_META[page]?.path || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#4A4A44] font-sans selection:bg-[#B5632F]/15 selection:text-[#1A1A18]">
      {/* Accessibility: Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0F2A24] focus:text-[#F4F1EA] focus:border focus:border-[#B5632F] focus:rounded focus:outline-none shadow-md text-sm font-medium"
      >
        Skip to content
      </a>

      {/* Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
      />

      {/* Main Page Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {currentPage === 'home' && (
          <HomePage onNavigate={navigateTo} />
        )}

        {/* Protected: Offer Owners Intake */}
        {currentPage === 'offer-owners' && (
          <OfferOwnersPage
            onNavigateToSeekers={() => navigateTo('offer-seekers')}
            onNavigate={navigateTo}
          />
        )}

        {/* Protected: Offer Seekers Application */}
        {currentPage === 'offer-seekers' && (
          <OfferSeekersPage
            onNavigateToOwners={() => navigateTo('offer-owners')}
            onNavigate={navigateTo}
          />
        )}

        {/* Protected: Portal Dashboard */}
        {currentPage === 'dashboard' && (
          <DashboardPage onNavigate={navigateTo} />
        )}

        {/* Public: Contact */}
        {currentPage === 'contact' && (
          <ContactPage onNavigate={navigateTo} />
        )}

        {/* Public: Privacy Policy */}
        {currentPage === 'privacy' && (
          <PrivacyPage onNavigate={navigateTo} />
        )}

        {/* Public: Website Terms */}
        {currentPage === 'terms' && (
          <TermsPage onNavigate={navigateTo} />
        )}

        {/* Public / Auth: Sign In */}
        {currentPage === 'login' && (
          <LoginPage onNavigate={navigateTo} redirectTarget={redirectTarget} />
        )}

        {/* Public / Auth: Create Account */}
        {currentPage === 'signup' && (
          <SignUpPage onNavigate={navigateTo} redirectTarget={redirectTarget} />
        )}

        {/* 404 Fallback */}
        {currentPage === '404' && (
          <NotFoundPage onNavigate={navigateTo} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
