import React from 'react';
import { Mail, Instagram } from 'lucide-react';
import { PageId } from '../types';
import { siteConfig } from '../data/content';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
  </svg>
);

interface FooterProps {
  onNavigate: (page: PageId) => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenLegal,
}) => {
  return (
    <footer className="border-t border-[#2A453D] bg-[#0F2A24] text-[#B9C4BE]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
          {/* Brand & Summary */}
          <div className="md:col-span-2 space-y-4">
            <span className="font-serif text-2xl font-normal tracking-tight text-[#F4F1EA] block">
              {siteConfig.brandName}
            </span>
            <p className="text-[15px] text-[#B9C4BE] max-w-md leading-[1.7]">
              {siteConfig.oneLineDescription}
            </p>
            <p className="text-xs text-[#8A9A92] uppercase tracking-wider font-mono">
              Registered in the United Kingdom · Sales Placement Agency
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F4F1EA] mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-[15px] text-[#B9C4BE]">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#D4895A] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('offer-owners')}
                  className="hover:text-[#D4895A] transition-colors cursor-pointer"
                >
                  Offer Owners
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('offer-seekers')}
                  className="hover:text-[#D4895A] transition-colors cursor-pointer"
                >
                  Offer Seekers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#D4895A] transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Contact & Channels */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F4F1EA] mb-4">
              Direct Contact
            </h4>
            <div className="space-y-3.5 text-[15px]">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="inline-flex items-center gap-2 text-[#B9C4BE] hover:text-[#D4895A] transition-colors"
              >
                <Mail className="h-4 w-4 text-[#D4895A] stroke-[1.5]" />
                <span>{siteConfig.contactEmail}</span>
              </a>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram profile"
                  title="Follow on Instagram"
                  className="rounded border border-[#2A453D] bg-[#0F2A24] p-2 text-[#B9C4BE] hover:border-[#D4895A] hover:text-[#D4895A] transition-colors"
                >
                  <Instagram className="h-4 w-4 stroke-[1.5]" />
                </a>
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Message on WhatsApp"
                  title="Message on WhatsApp (07488376951)"
                  className="rounded border border-[#2A453D] bg-[#0F2A24] p-2 text-[#B9C4BE] hover:border-[#D4895A] hover:text-[#D4895A] transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2A453D] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A9A92]">
          <p>© {new Date().getFullYear()} Vox Direct. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-[#D4895A] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-[#D4895A] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
