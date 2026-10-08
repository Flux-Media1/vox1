import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PageId } from '../types';
import { siteConfig } from '../data/content';

interface TermsPageProps {
  onNavigate: (page: PageId) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#FAF8F4] text-[#4A4A44]">
      {/* Editorial Header (Deep Ink Green #0F2A24) */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-16 md:py-20 border-b border-[#2A453D]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A] mb-4">
            <span className="w-5 h-px bg-[#D4895A]" aria-hidden="true" />
            <span>UK Commercial Terms &amp; Conditions</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.02em] text-[#F4F1EA]">
            Website Terms of Use
          </h1>
          <p className="mt-4 text-[17px] text-[#B9C4BE] leading-[1.7] max-w-2xl">
            Clear, transparent terms governing the use of the Vox Direct website and our sales talent introduction service.
          </p>
          <div className="mt-6 flex items-center gap-4 text-xs text-[#8A9A92] font-mono">
            <span>Last updated: October 2026</span>
            <span>·</span>
            <span>Governing Law: England and Wales</span>
          </div>
        </div>
      </section>

      {/* Main Legal Content */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-8">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 text-sm text-[#4A4A44] hover:text-[#B5632F] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to home</span>
            </button>
          </div>

          <article className="space-y-12 text-[16px] leading-[1.75]">
            {/* 1. Introduction & Acceptance */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                1. Introduction and Acceptance
              </h2>
              <p className="mb-4">
                Welcome to <strong>Vox Direct</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). These Website Terms of Use govern your access to and use of our website located at <a href="https://vox-direct.com" className="text-[#B5632F] underline">vox-direct.com</a> and any related services provided by Vox Direct.
              </p>
              <p>
                By browsing our website, submitting an enquiry, or applying for placement, you confirm that you have read, understood, and agree to be bound by these Terms and our <button onClick={() => onNavigate('privacy')} className="text-[#B5632F] underline hover:text-[#9B5325] cursor-pointer">Privacy Policy</button>. If you do not agree with any part of these Terms, you must not use our website or services.
              </p>
            </div>

            {/* 2. About Our Service & Scope of Introductions */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                2. About the Service &amp; Scope of Introductions
              </h2>
              <p className="mb-4">
                Vox Direct operates as an independent sales introduction and placement consultancy based in the United Kingdom. We introduce business offer owners seeking sales talent to qualified appointment setters and closers, and vice versa.
              </p>
              <div className="card-hairline p-5 bg-white space-y-3 mb-4">
                <p className="font-semibold text-[#1A1A18]">
                  Crucial Distinction Regarding Agreements &amp; Results:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <strong>We are an introducer only:</strong> Vox Direct acts solely to introduce prospective parties. We are not an employer, partner, joint venturer, or party to any contract, agreement, or commercial arrangement formed between an offer owner and a salesperson.
                  </li>
                  <li>
                    <strong>No guarantee of placement:</strong> Submitting an offer or candidate application does not guarantee that a placement or introduction will be made.
                  </li>
                  <li>
                    <strong>No guarantee of earnings or commercial performance:</strong> We make no representations or warranties regarding sales performance, close rates, show-up rates, lead quality, conversion metrics, or financial earnings. All commercial arrangements are negotiated and agreed entirely between the introduced parties.
                  </li>
                </ul>
              </div>
            </div>

            {/* 3. Strict No-Fee Policy for Candidates */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                3. Zero Fee for Candidates (Work-Finding Services)
              </h2>
              <div className="border-l-2 border-[#B5632F] pl-4 py-1 bg-[#F1EDE5]/50">
                <p className="font-semibold text-[#1A1A18] mb-2">
                  No Fee Charged to Job-Seekers or Sales Candidates
                </p>
                <p className="text-sm">
                  In strict accordance with the UK <strong>Employment Agencies Act 1973</strong> and the <strong>Conduct of Employment Agencies and Employment Businesses Regulations 2003</strong>, Vox Direct does <strong>not</strong> charge any fee, upfront deposit, administration charge, or ongoing commission to candidates or job-seekers for work-finding or placement introduction services.
                </p>
              </div>
            </div>

            {/* 4. Acceptable Use */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                4. Acceptable Use of the Website
              </h2>
              <p className="mb-4">
                You agree to use this website only for lawful purposes related to legitimate sales placement enquiries. You agree not to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Submit fabricated, fraudulent, deceptive, or defamatory details or impersonate any individual or entity.</li>
                <li>Attempt to bypass, manipulate, or trigger automated bot submissions on our forms or honeypot fields.</li>
                <li>Transmit any unsolicited advertising, promotional materials, spam, chain letters, or multi-level marketing solicitations.</li>
                <li>Introduce viruses, trojans, worms, logic bombs, or other malicious material, or attempt unauthorized access to our hosting or server infrastructure.</li>
                <li>Scrape, spider, crawl, or harvest contact details or candidate information from this website using automated tools without our prior written consent.</li>
              </ul>
            </div>

            {/* 5. Accuracy of Information Supplied by Users */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                5. Accuracy of Information Supplied by Users
              </h2>
              <p className="mb-4">
                Both offer owners and sales candidates warrant that all information, claims, metrics, experience histories, and contact numbers submitted across our forms are true, accurate, current, and complete.
              </p>
              <p className="text-sm">
                Offer owners must accurately represent their commercial offer, fulfillment capacity, and commission model. Sales candidates must honestly state their previous experience, closed revenue, and track record. Vox Direct reserves the right to decline or terminate introductions where misleading information has been provided.
              </p>
            </div>

            {/* 6. Intellectual Property */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                6. Intellectual Property Rights
              </h2>
              <p className="mb-4">
                All content published on this website—including but not limited to text, headlines, editorial layout, branding, logos, graphics, icons, and software code—is the intellectual property of Vox Direct or its licensors and is protected by United Kingdom and international copyright, trade mark, and database laws.
              </p>
              <p className="text-sm">
                You may access, view, and print pages from this website solely for your own personal or internal business evaluation. You must not copy, reproduce, modify, republish, distribute, or exploit any portion of the site without our prior written permission.
              </p>
            </div>

            {/* 7. Limitation of Liability */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                7. Limitation of Liability
              </h2>
              <p className="mb-4">
                To the fullest extent permitted by English law:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm mb-4">
                <li>
                  The website and introduction service are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied.
                </li>
                <li>
                  Vox Direct shall not be liable for any indirect, incidental, consequential, punitive, or economic loss (including without limitation loss of profits, loss of sales, loss of revenue, business interruption, or loss of goodwill) arising out of or in connection with the use of our website or any introduction made between parties.
                </li>
                <li>
                  We accept no liability for the acts, omissions, defaults, misrepresentations, conduct, or contractual breaches of any third-party offer owner or salesperson introduced through our service.
                </li>
              </ul>
              <div className="card-hairline p-4 bg-white text-xs text-[#1A1A18]">
                <strong>Statutory Protections:</strong> Nothing in these Terms shall limit or exclude our liability for death or personal injury resulting from our negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited by the law of England and Wales.
              </div>
            </div>

            {/* 8. Third-Party Links */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                8. Third-Party Links &amp; External Services
              </h2>
              <p className="mb-4">
                Our website may include links to third-party services and social channels (such as Instagram, WhatsApp, LinkedIn, or video hosting platforms). These links are provided solely for your convenience.
              </p>
              <p className="text-sm">
                We have no control over the contents, terms, or privacy policies of third-party websites and accept no responsibility for them or for any loss or damage that may arise from your use of them.
              </p>
            </div>

            {/* 9. Governing Law & Jurisdiction */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                9. Governing Law and Jurisdiction
              </h2>
              <p className="mb-4">
                These Terms of Use, their subject matter, and their formation (and any non-contractual disputes or claims) shall be governed by and construed in accordance with the <strong>laws of England and Wales</strong>.
              </p>
              <p className="text-sm">
                You and Vox Direct irrevocably agree that the courts of England and Wales shall have exclusive jurisdiction to settle any dispute or claim arising out of or in connection with these Terms or your use of the website.
              </p>
            </div>

            {/* 10. Contact Details */}
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                10. Contact Information
              </h2>
              <p className="mb-4">
                If you have any questions or queries concerning these Website Terms of Use, please reach out directly:
              </p>
              <div className="card-hairline p-4 bg-white space-y-1.5 text-sm">
                <p><strong>Business Name:</strong> Vox Direct</p>
                <p><strong>Contact Desk:</strong> Joe Cunliffe</p>
                <p>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${siteConfig.contactEmail}`} className="text-[#B5632F] underline hover:text-[#9B5325]">
                    {siteConfig.contactEmail}
                  </a>
                </p>
                <p><strong>Location:</strong> United Kingdom</p>
              </div>
            </div>
          </article>

          <div className="mt-12 pt-8 border-t border-[#DDD7CB] flex justify-between items-center">
            <button
              onClick={() => onNavigate('home')}
              className="btn-secondary-light !py-2.5 !px-5 text-sm"
            >
              Return to Homepage
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              className="text-sm text-[#B5632F] hover:underline"
            >
              Read our Privacy Policy &rarr;
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
