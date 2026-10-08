/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageId } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { SubmissionsViewer } from './components/SubmissionsViewer';
import { HomePage } from './pages/HomePage';
import { OfferOwnersPage } from './pages/OfferOwnersPage';
import { OfferSeekersPage } from './pages/OfferSeekersPage';
import { ContactPage } from './pages/ContactPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [submissionsViewerOpen, setSubmissionsViewerOpen] = useState(false);

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const navigateTo = (page: PageId) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage onNavigate={navigateTo} />
        )}

        {currentPage === 'offer-owners' && (
          <OfferOwnersPage
            onNavigateToSeekers={() => navigateTo('offer-seekers')}
          />
        )}

        {currentPage === 'offer-seekers' && (
          <OfferSeekersPage
            onNavigateToOwners={() => navigateTo('offer-owners')}
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={navigateTo}
        onOpenLegal={(type) => setLegalModalType(type)}
        onOpenSubmissions={() => setSubmissionsViewerOpen(true)}
      />

      {/* Modals */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      <SubmissionsViewer
        isOpen={submissionsViewerOpen}
        onClose={() => setSubmissionsViewerOpen(false)}
      />
    </div>
  );
}
