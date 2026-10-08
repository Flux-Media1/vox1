import React, { useState } from 'react';
import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import { PageId } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const navLinks: { id: PageId; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'offer-owners', label: 'Offer Owners' },
    { id: 'offer-seekers', label: 'Offer Seekers' },
    { id: 'contact', label: 'Contact' },
  ];

  if (user) {
    navLinks.push({ id: 'dashboard', label: 'Dashboard' });
  }

  if (isAdmin) {
    navLinks.push({ id: 'admin', label: 'Admin Portal' });
  }

  const handleLinkClick = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
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
        <nav className="hidden md:flex items-center gap-7">
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

        {/* Desktop Action & Auth State */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            /* Authenticated state: user indicator + Log Out button */
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLinkClick('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#DDD7CB] bg-[#F1EDE5] text-xs text-[#1A1A18] hover:border-[#B5632F] transition-colors cursor-pointer"
                title={user.email}
              >
                <User className="w-3.5 h-3.5 text-[#B5632F]" />
                <span className="max-w-[130px] truncate font-mono text-[11px]">
                  {user.email}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#B5632F] bg-[#FAF3EE] px-1 py-0.5 rounded border border-[#B5632F]/20">
                  {user.role === 'owner' ? 'Owner' : 'Candidate'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn-secondary-light !py-2 !px-3.5 text-[13px] flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated state: "Sign In" text link + copper "Get Started" CTA button */
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLinkClick('login')}
                className="text-[14px] font-medium text-[#4A4A44] hover:text-[#B5632F] transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => handleLinkClick('signup')}
                className="btn-primary-dark !py-2.5 !px-5 text-[14px]"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <button
              onClick={() => handleLinkClick('dashboard')}
              className="p-1.5 text-xs text-[#1A1A18] bg-[#F1EDE5] rounded border border-[#DDD7CB] flex items-center gap-1 mr-1"
            >
              <User className="w-3.5 h-3.5 text-[#B5632F]" />
              <span className="text-[11px] font-mono max-w-[80px] truncate">{user.email.split('@')[0]}</span>
            </button>
          )}
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
            {user ? (
              <>
                <div className="px-3 py-2 bg-[#F1EDE5] rounded border border-[#DDD7CB] text-xs space-y-1">
                  <div className="text-[#8A9A92] uppercase tracking-wider text-[10px]">Signed In As</div>
                  <div className="font-mono text-[#1A1A18] truncate">{user.email}</div>
                  <div className="text-[#B5632F] font-semibold text-[11px]">
                    Role: {user.role === 'owner' ? 'Offer Owner' : 'Setter / Closer'}
                  </div>
                </div>
                <button
                  onClick={() => handleLinkClick('dashboard')}
                  className="btn-primary-light w-full py-2.5 text-center text-sm flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary-light w-full py-2.5 text-center text-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleLinkClick('login')}
                  className="btn-secondary-light w-full py-2.5 text-center text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleLinkClick('signup')}
                  className="btn-primary-dark w-full py-2.5 text-center text-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
