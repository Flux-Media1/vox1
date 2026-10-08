import React, { useState } from 'react';
import { ArrowRight, UserCheck, Briefcase } from 'lucide-react';
import { PageId } from '../types';
import { homeContent } from '../data/content';
import { Component as VoiceTestimonials, Testimonial } from '@/components/ui/voice-testimonial';
import { AddTestimonialModal } from '../components/AddTestimonialModal';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    try {
      const saved = localStorage.getItem('vox_direct_testimonials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter(
            (item: Testimonial) =>
              item.id?.startsWith('test_') &&
              ![
                'Ethan Smith',
                'Olivia Chen',
                'Liam Johnson',
                'Ava Martinez',
                'Noah Williams',
                'Sophia Brown',
                'James Davis',
                'Benjamin Miller',
              ].includes(item.name || '')
          );
          return userOnly;
        }
      }
    } catch (e) {
      console.warn('Could not read testimonials from storage', e);
    }
    return [];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddTestimonial = (newTestimonial: Testimonial) => {
    const updated = [newTestimonial, ...testimonials];
    setTestimonials(updated);
    try {
      localStorage.setItem('vox_direct_testimonials', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save testimonial to storage', e);
    }
  };

  return (
    <div className="bg-[#FAF8F4] text-[#4A4A44]">
      {/* 1. Hero Section (Deep Ink Green #0F2A24) */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-24 md:py-32 border-b border-[#2A453D]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          {/* Eyebrow Label: plain uppercase text, no pill background, copper rule */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A] mb-6">
            <span className="w-6 h-px bg-[#D4895A]" aria-hidden="true" />
            <span>Sales Placement Agency · United Kingdom</span>
            <span className="w-6 h-px bg-[#D4895A]" aria-hidden="true" />
          </div>

          {/* Hero Headline: Fraunces 500, 56-64px desktop, line-height 1.08, -0.02em, #F4F1EA, one uniform colour, italic emphasis on Closers */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-normal tracking-[-0.02em] leading-[1.08] text-[#F4F1EA] max-w-4xl mx-auto">
            Sales Placement for Offer Owners, Setters, and <span className="italic font-normal">Closers</span>
          </h1>

          {/* Hero Subheading: Inter 400, 19-20px, #B9C4BE, max-width 34rem */}
          <p className="mt-6 text-[19px] sm:text-[20px] text-[#B9C4BE] font-normal leading-[1.6] max-w-[34rem] mx-auto">
            {homeContent.hero.description}
          </p>

          {/* Buttons: Consistent site-wide hierarchy */}
          {/* "I'm Looking for an Offer" is always primary; "I Have an Offer" is always secondary */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('offer-seekers')}
              className="btn-primary-dark w-full sm:w-auto text-[15px]"
            >
              {homeContent.hero.secondaryButtonText}
            </button>
            <button
              onClick={() => onNavigate('offer-owners')}
              className="btn-secondary-dark w-full sm:w-auto text-[15px]"
            >
              {homeContent.hero.primaryButtonText}
            </button>
          </div>

          {/* Tabular details / hairline divider */}
          <div className="mt-16 pt-8 border-t border-[#2A453D] flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-xs tracking-wider uppercase font-medium text-[#B9C4BE] font-mono tabular-nums">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-[#D4895A] rounded-full" />
              <span>Vetted B2B Deals</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-[#D4895A] rounded-full" />
              <span>Qualified Talent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-[#D4895A] rounded-full" />
              <span>Direct Placements</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Side-by-Side Cards (Alternate Section Background #F1EDE5) */}
      <section className="bg-[#F1EDE5] py-24 md:py-28 border-b border-[#DDD7CB]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-3">
              <span className="w-6 h-px bg-[#B5632F]" aria-hidden="true" />
              <span>Two Audiences</span>
              <span className="w-6 h-px bg-[#B5632F]" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-3xl sm:text-[38px] font-normal tracking-[-0.015em] leading-[1.15] text-[#1A1A18]">
              Choose Your Placement Path
            </h2>
            <p className="mt-3 text-[16px] text-[#4A4A44] leading-[1.7] max-w-[65ch] mx-auto">
              Connecting high-ticket offer owners with dedicated appointment setters and proven closers without job boards or agency overheads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* Offer Owners Card: White hairline card, no shadow, copper border on hover */}
            <div className="card-hairline p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-4">
                  <span className="w-4 h-px bg-[#B5632F]" aria-hidden="true" />
                  <Briefcase className="h-4 w-4 stroke-[1.5]" />
                  <span>{homeContent.dualCards.owners.title}</span>
                </div>

                <h3 className="font-serif text-2xl sm:text-[26px] font-normal text-[#1A1A18] leading-[1.25]">
                  {homeContent.dualCards.owners.question}
                </h3>
                <p className="mt-4 text-[16px] text-[#4A4A44] leading-[1.7] max-w-[65ch]">
                  {homeContent.dualCards.owners.description}
                </p>

                <ul className="mt-6 space-y-2.5 text-[14px] text-[#4A4A44]">
                  <li className="flex items-baseline gap-2.5">
                    <span className="text-[#B5632F] font-bold">—</span>
                    <span>Matched directly with proven setters & closers</span>
                  </li>
                  <li className="flex items-baseline gap-2.5">
                    <span className="text-[#B5632F] font-bold">—</span>
                    <span>Zero job board spam or recruitment fees</span>
                  </li>
                  <li className="flex items-baseline gap-2.5">
                    <span className="text-[#B5632F] font-bold">—</span>
                    <span>Flexible commission & performance structures</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 pt-6 border-t border-[#DDD7CB]">
                {/* Hierarchy: Offer Owners is Secondary */}
                <button
                  onClick={() => onNavigate('offer-owners')}
                  className="btn-secondary-light w-full sm:w-auto inline-flex items-center justify-center gap-2"
                >
                  <span>{homeContent.dualCards.owners.buttonText}</span>
                  <ArrowRight className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Offer Seekers Card: White hairline card, no shadow, copper border on hover */}
            <div className="card-hairline p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-4">
                  <span className="w-4 h-px bg-[#B5632F]" aria-hidden="true" />
                  <UserCheck className="h-4 w-4 stroke-[1.5]" />
                  <span>{homeContent.dualCards.seekers.title}</span>
                </div>

                <h3 className="font-serif text-2xl sm:text-[26px] font-normal text-[#1A1A18] leading-[1.25]">
                  {homeContent.dualCards.seekers.question}
                </h3>
                <p className="mt-4 text-[16px] text-[#4A4A44] leading-[1.7] max-w-[65ch]">
                  {homeContent.dualCards.seekers.description}
                </p>

                <ul className="mt-6 space-y-2.5 text-[14px] text-[#4A4A44]">
                  <li className="flex items-baseline gap-2.5">
                    <span className="text-[#B5632F] font-bold">—</span>
                    <span>Direct access to vetted, active offer owners</span>
                  </li>
                  <li className="flex items-baseline gap-2.5">
                    <span className="text-[#B5632F] font-bold">—</span>
                    <span>Opportunities aligned with your niche & skills</span>
                  </li>
                  <li className="flex items-baseline gap-2.5">
                    <span className="text-[#B5632F] font-bold">—</span>
                    <span>Start selling without upfront application fees</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 pt-6 border-t border-[#DDD7CB]">
                {/* Hierarchy: Offer Seekers is Primary */}
                <button
                  onClick={() => onNavigate('offer-seekers')}
                  className="btn-primary-light w-full sm:w-auto inline-flex items-center justify-center gap-2"
                >
                  <span>{homeContent.dualCards.seekers.buttonText}</span>
                  <ArrowRight className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section (Warm Paper White #FAF8F4) */}
      <section className="bg-[#FAF8F4] py-24 md:py-28 border-b border-[#DDD7CB]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-3">
              <span className="w-6 h-px bg-[#B5632F]" aria-hidden="true" />
              <span>Placement Process</span>
              <span className="w-6 h-px bg-[#B5632F]" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-3xl sm:text-[38px] font-normal tracking-[-0.015em] leading-[1.15] text-[#1A1A18]">
              {homeContent.howItWorks.heading}
            </h2>
            <p className="mt-3 text-[16px] text-[#4A4A44] leading-[1.7] max-w-[65ch] mx-auto">
              {homeContent.howItWorks.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Steps For Offer Owners */}
            <div className="card-hairline p-8 sm:p-10">
              <div className="flex items-center justify-between pb-4 border-b border-[#DDD7CB]">
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#1A1A18]">
                  {homeContent.howItWorks.forOwners.title}
                </h3>
                <span className="text-xs uppercase tracking-wider text-[#B5632F] font-semibold">
                  For Businesses
                </span>
              </div>

              <div className="mt-8 space-y-8">
                {homeContent.howItWorks.forOwners.steps.map((step) => (
                  <div key={step.stepNumber} className="flex gap-4">
                    <span className="font-mono text-sm font-semibold text-[#B5632F] pt-0.5 tabular-nums shrink-0">
                      [{step.stepNumber}]
                    </span>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-[16px] font-semibold text-[#1A1A18]">
                        {step.title}
                      </h4>
                      <p className="text-[15px] text-[#4A4A44] leading-[1.7] max-w-[65ch]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-[#DDD7CB]">
                <button
                  onClick={() => onNavigate('offer-owners')}
                  className="text-[14px] font-semibold text-[#1A1A18] hover:text-[#B5632F] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Submit your offer requirements</span>
                  <ArrowRight className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Steps For Offer Seekers */}
            <div className="card-hairline p-8 sm:p-10">
              <div className="flex items-center justify-between pb-4 border-b border-[#DDD7CB]">
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#1A1A18]">
                  {homeContent.howItWorks.forSeekers.title}
                </h3>
                <span className="text-xs uppercase tracking-wider text-[#B5632F] font-semibold">
                  For Sales Talent
                </span>
              </div>

              <div className="mt-8 space-y-8">
                {homeContent.howItWorks.forSeekers.steps.map((step) => (
                  <div key={step.stepNumber} className="flex gap-4">
                    <span className="font-mono text-sm font-semibold text-[#B5632F] pt-0.5 tabular-nums shrink-0">
                      [{step.stepNumber}]
                    </span>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-[16px] font-semibold text-[#1A1A18]">
                        {step.title}
                      </h4>
                      <p className="text-[15px] text-[#4A4A44] leading-[1.7] max-w-[65ch]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-[#DDD7CB]">
                <button
                  onClick={() => onNavigate('offer-seekers')}
                  className="text-[14px] font-semibold text-[#1A1A18] hover:text-[#B5632F] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Apply for sales placement</span>
                  <ArrowRight className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Testimonial Section (Alternate Background #F1EDE5) */}
      <section className="bg-[#F1EDE5] py-24 md:py-28 border-b border-[#DDD7CB]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-3">
              <span className="w-6 h-px bg-[#B5632F]" aria-hidden="true" />
              <span>Feedback & Verifications</span>
              <span className="w-6 h-px bg-[#B5632F]" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-3xl sm:text-[38px] font-normal tracking-[-0.015em] leading-[1.15] text-[#1A1A18]">
              Read and listen to what people are saying
            </h2>
            <p className="mt-3 text-[16px] text-[#4A4A44] leading-[1.7]">
              Verified feedback from placement partners across the UK and international markets.
            </p>
          </div>

          <VoiceTestimonials
            mode="light"
            testimonials={testimonials}
            onAddTestimonialClick={() => setIsAddModalOpen(true)}
            title="Read and listen to what people are saying"
            subtitle="Audio and written feedback from verified offer owners, appointment setters, and closers."
          />
        </div>
      </section>

      {/* 5. CTA Band (Deep Ink Green #0F2A24) */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-24 md:py-28 border-b border-[#2A453D]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A]">
            <span className="w-6 h-px bg-[#D4895A]" aria-hidden="true" />
            <span>Ready to Begin</span>
            <span className="w-6 h-px bg-[#D4895A]" aria-hidden="true" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.02em] leading-[1.1] text-[#F4F1EA]">
            Find the right reps or the right offer today
          </h2>
          <p className="text-[18px] text-[#B9C4BE] max-w-[34rem] mx-auto leading-[1.7]">
            Stop losing pipeline momentum. Connect directly with vetted appointment setters and proven closers through Vox Direct.
          </p>

          {/* Consistent hierarchy on dark: "I'm Looking for an Offer" (Primary Copper) and "I Have an Offer" (Secondary White) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('offer-seekers')}
              className="btn-primary-dark w-full sm:w-auto"
            >
              I'm Looking for an Offer
            </button>
            <button
              onClick={() => onNavigate('offer-owners')}
              className="btn-secondary-dark w-full sm:w-auto"
            >
              I Have an Offer
            </button>
          </div>
        </div>
      </section>

      {/* Add Testimonial Modal */}
      <AddTestimonialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTestimonial={handleAddTestimonial}
      />
    </div>
  );
};
