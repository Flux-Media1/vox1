import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageId } from '../types';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: PageId; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'offer-owners', label: 'Offer Owners' },
    { id: 'offer-seekers', label: 'Offer Seekers' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleLinkClick = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F4] border-b border-[#DDD7CB]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4.5">
        {/* Brand: Fraunces 600 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleLinkClick('home')}
            className="text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5632F]"
          >
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#1A1A18] hover:text-[#B5632F] transition-colors">
              Vox Direct
            </span>
          </button>
        </div>

        {/* Desktop Nav Links: Inter 500, 15px, #1A1A18, 2px copper underline for active */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`text-[15px] font-medium transition-colors cursor-pointer py-1 relative ${
                  isActive
                    ? 'text-[#1A1A18] font-semibold'
                    : 'text-[#4A4A44] hover:text-[#B5632F]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#B5632F]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Action Buttons: Consistent hierarchy site-wide */}
        {/* "I Have an Offer" is Secondary; "I'm Looking for an Offer" is Primary */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => handleLinkClick('offer-owners')}
            className="btn-secondary-light !py-2.5 !px-4.5 text-[14px]"
          >
            I Have an Offer
          </button>
          <button
            onClick={() => handleLinkClick('offer-seekers')}
            className="btn-primary-light !py-2.5 !px-4.5 text-[14px]"
          >
            I'm Looking for an Offer
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 text-[#1A1A18] hover:text-[#B5632F] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-[#DDD7CB] bg-[#FAF8F4] px-4 pt-3 pb-6 md:hidden">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`text-left text-[15px] font-medium py-2 px-3 transition-colors ${
                    isActive
                      ? 'bg-[#F1EDE5] text-[#1A1A18] font-semibold border-l-2 border-[#B5632F]'
                      : 'text-[#4A4A44] hover:text-[#B5632F]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-col gap-2.5 border-t border-[#DDD7CB] pt-4">
            <button
              onClick={() => handleLinkClick('offer-owners')}
              className="btn-secondary-light w-full py-3 text-center"
            >
              I Have an Offer
            </button>
            <button
              onClick={() => handleLinkClick('offer-seekers')}
              className="btn-primary-light w-full py-3 text-center"
            >
              I'm Looking for an Offer
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
