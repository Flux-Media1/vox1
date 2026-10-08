import React from 'react';
import { ArrowLeft, Home, Compass } from 'lucide-react';
import { PageId } from '../types';

interface NotFoundPageProps {
  onNavigate: (page: PageId) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#FAF8F4] text-[#4A4A44] min-h-[70vh] flex flex-col justify-center">
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          {/* Eyebrow Label: plain uppercase text, copper rule */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A] mb-6">
            <span className="w-5 h-px bg-[#D4895A]" aria-hidden="true" />
            <span>404 · Page Not Found</span>
            <span className="w-5 h-px bg-[#D4895A]" aria-hidden="true" />
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.02em] text-[#1A1A18] mb-6">
            This page does not exist
          </h1>

          <p className="text-[18px] text-[#4A4A44] leading-[1.7] max-w-md mx-auto mb-10">
            The link you followed may be broken, or the page may have been moved or removed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="btn-primary-light w-full sm:w-auto"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Homepage
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="btn-secondary-light w-full sm:w-auto"
            >
              Contact Placement Desk
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-[#DDD7CB] text-xs text-[#8A9A92] font-mono">
            <span>Vox Direct · UK Sales Placement</span>
          </div>
        </div>
      </section>
    </div>
  );
};
