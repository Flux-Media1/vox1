import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, User, LayoutDashboard, MessageSquare } from 'lucide-react';
import { PageId } from '../types';
import { useAuth } from '../context/AuthContext';
import { messagesService } from '../services/messagesService';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const updateCount = () => {
      if (user) {
        const count = messagesService.getUnreadCountForRecipient(
          user.id || user.email,
          isAdmin ? 'admin' : 'applicant'
        );
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    };

    updateCount();
    window.addEventListener('vox_direct_messages_updated', updateCount);
    return () => {
      window.removeEventListener('vox_direct_messages_updated', updateCount);
    };
  }, [user, isAdmin]);

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
        <nav className="hidden md:flex items-center gap-6 lg:gap-7">
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
                <span className="inline-flex items-center gap-1.5">
                  <span>{link.label}</span>
                  {link.id === 'dashboard' && unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#B5632F] inline-block animate-pulse" title={`${unreadCount} unread messages`} />
                  )}
                </span>
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
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            /* Authenticated state: user indicator + Log Out button */
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleLinkClick('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#DDD7CB] bg-[#F1EDE5] text-xs text-[#1A1A18] hover:border-[#B5632F] transition-colors cursor-pointer"
                title={user.email}
              >
                <User className="w-3.5 h-3.5 text-[#B5632F]" />
                <span className="max-w-[120px] lg:max-w-[150px] truncate font-mono text-[11px]">
                  {user.email}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#B5632F] bg-[#FAF3EE] px-1 py-0.5 rounded border border-[#B5632F]/20">
                  {user.role === 'owner' ? 'Owner' : 'Candidate'}
                </span>
                {unreadCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#B5632F] px-1.5 py-0.5 rounded shadow-sm" title={`${unreadCount} unread message(s)`}>
                    <MessageSquare className="w-2.5 h-2.5" />
                    <span>{unreadCount}</span>
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn-secondary-light !py-2 !px-3 text-[13px] flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated state: "Sign In" text link + copper "Get Started" CTA button */
            <div className="flex items-center gap-3 lg:gap-4">
              <button
                onClick={() => handleLinkClick('login')}
                className="text-[14px] font-medium text-[#4A4A44] hover:text-[#B5632F] transition-colors cursor-pointer px-2 py-1"
              >
                Sign In
              </button>
              <button
                onClick={() => handleLinkClick('signup')}
                className="btn-primary-dark !py-2 !px-4 lg:!px-5 text-[14px]"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger & quick indicators */}
        <div className="flex md:hidden items-center gap-1.5">
          {user && (
            <button
              onClick={() => handleLinkClick('dashboard')}
              className="p-1.5 sm:px-2.5 py-1.5 text-xs text-[#1A1A18] bg-[#F1EDE5] hover:bg-[#EAE4D8] rounded border border-[#DDD7CB] flex items-center gap-1.5 cursor-pointer"
              title={`Dashboard (${user.email})`}
            >
              <User className="w-3.5 h-3.5 text-[#B5632F] shrink-0" />
              <span className="text-[11px] font-mono max-w-[85px] truncate hidden xs:inline">{user.email.split('@')[0]}</span>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-[#B5632F] rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1A1A18] hover:text-[#B5632F] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5632F] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Drawer Dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 top-[65px] bg-black/30 backdrop-blur-[1px] z-30 md:hidden"
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative z-40 border-b border-[#DDD7CB] bg-[#FAF8F4] px-4 pt-3 pb-6 md:hidden shadow-lg animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-1.5">
              {navLinks.map((link) => {
                const isActive = currentPage === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id)}
                    className={`text-left text-[15px] font-medium py-3 px-3.5 rounded transition-colors flex items-center justify-between min-h-[44px] ${
                      isActive
                        ? 'bg-[#F1EDE5] text-[#1A1A18] font-semibold border-l-3 border-[#B5632F]'
                        : 'text-[#4A4A44] hover:text-[#B5632F] hover:bg-[#F1EDE5]/50'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.id === 'dashboard' && unreadCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#B5632F] px-2 py-0.5 rounded shadow-xs">
                        <MessageSquare className="w-3 h-3" />
                        <span>{unreadCount} unread</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 flex flex-col gap-2.5 border-t border-[#DDD7CB] pt-4">
              {user ? (
                <>
                  <div className="px-3.5 py-2.5 bg-[#F1EDE5] rounded border border-[#DDD7CB] text-xs space-y-1">
                    <div className="text-[#8A9A92] uppercase tracking-wider text-[10px] font-semibold">Signed In Account</div>
                    <div className="font-mono text-[#1A1A18] truncate text-xs">{user.email}</div>
                    <div className="text-[#B5632F] font-semibold text-[11px] flex items-center justify-between">
                      <span>Role: {user.role === 'owner' ? 'Offer Owner' : 'Setter / Closer'}</span>
                      {isAdmin && (
                        <span className="text-[10px] text-white bg-[#0F2A24] px-1.5 py-0.5 rounded font-mono font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleLinkClick('dashboard')}
                      className="btn-primary-light min-h-[44px] py-2.5 px-3 text-center text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="btn-secondary-light min-h-[44px] py-2.5 px-3 text-center text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => handleLinkClick('login')}
                    className="btn-secondary-light w-full min-h-[44px] py-2.5 text-center text-sm cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleLinkClick('signup')}
                    className="btn-primary-dark w-full min-h-[44px] py-2.5 text-center text-sm cursor-pointer"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
