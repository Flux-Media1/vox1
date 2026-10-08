import React from 'react';
import { ShieldCheck, Mail, ArrowLeft, ExternalLink } from 'lucide-react';
import { PageId } from '../types';
import { siteConfig } from '../data/content';

interface PrivacyPageProps {
  onNavigate: (page: PageId) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#FAF8F4] text-[#4A4A44]">
      {/* Editorial Header (Deep Ink Green #0F2A24) */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-16 md:py-20 border-b border-[#2A453D]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A] mb-4">
            <span className="w-5 h-px bg-[#D4895A]" aria-hidden="true" />
            <span>UK GDPR & Data Protection Act 2018</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.02em] text-[#F4F1EA]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-[17px] text-[#B9C4BE] leading-[1.7] max-w-2xl">
            A plain-English explanation of how Vox Direct collects, uses, stores, and protects personal data across our sales introduction service.
          </p>
          <div className="mt-6 flex items-center gap-4 text-xs text-[#8A9A92] font-mono">
            <span>Last updated: October 2026</span>
            <span>·</span>
            <span>Jurisdiction: United Kingdom</span>
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
            {/* 1. Who We Are */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                1. Who We Are
              </h2>
              <p className="mb-4">
                Vox Direct (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates as a UK sales placement and introduction business connecting offer owners with appointment setters and closers.
              </p>
              <p className="mb-4">
                For the purposes of the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018, Vox Direct is the <strong>data controller</strong> responsible for the personal data collected through this website.
              </p>
              <div className="card-hairline p-4 text-sm bg-white mt-4 space-y-1.5">
                <p><strong>Data Controller:</strong> Vox Direct</p>
                <p><strong>Primary Contact &amp; Privacy Officer:</strong> Joe Cunliffe</p>
                <p>
                  <strong>Contact Email:</strong>{' '}
                  <a href={`mailto:${siteConfig.contactEmail}`} className="text-[#B5632F] underline hover:text-[#9B5325]">
                    {siteConfig.contactEmail}
                  </a>
                </p>
                <p><strong>Location:</strong> United Kingdom</p>
              </div>
            </div>

            {/* 2. What Personal Data We Collect */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                2. What Personal Data We Collect
              </h2>
              <p className="mb-4">
                We only collect personal information that you voluntarily choose to provide when interacting with our placement desk. This is gathered through our three website forms:
              </p>

              <div className="space-y-4 mt-4">
                <div className="border-l-2 border-[#B5632F] pl-4">
                  <h3 className="font-sans font-semibold text-[#1A1A18] text-base mb-1">
                    A. Offer Owners &amp; Hiring Businesses
                  </h3>
                  <p className="text-sm">
                    Full name, business email address, direct phone number, company name, website URL, description of your product or service offer, commission and compensation structure, anticipated lead or call volume, and any operational notes or requirements you submit.
                  </p>
                </div>

                <div className="border-l-2 border-[#B5632F] pl-4">
                  <h3 className="font-sans font-semibold text-[#1A1A18] text-base mb-1">
                    B. Sales Candidates &amp; Offer Seekers
                  </h3>
                  <p className="text-sm">
                    Full name, email address, phone number, location and operating timezone, sales role sought (appointment setter, closer, or both), background and track record description, niches worked in, software and CRM tools used, links to video introductions, LinkedIn, or portfolios, and availability notes.
                  </p>
                </div>

                <div className="border-l-2 border-[#B5632F] pl-4">
                  <h3 className="font-sans font-semibold text-[#1A1A18] text-base mb-1">
                    C. General Contact Enquiries
                  </h3>
                  <p className="text-sm">
                    Full name, email address, enquiry subject, and the contents of your message.
                  </p>
                </div>

                <div className="border-l-2 border-[#B5632F] pl-4">
                  <h3 className="font-sans font-semibold text-[#1A1A18] text-base mb-1">
                    D. Technical Infrastructure Logs
                  </h3>
                  <p className="text-sm">
                    When you access the website, standard web server logs (including IP address, browser type, referring URL, and timestamp) are temporarily processed by our cloud infrastructure provider (Vercel) purely to ensure security, detect attacks, and maintain uptime.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Why We Use It & Lawful Basis */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                3. Why We Use It and Our Lawful Basis
              </h2>
              <p className="mb-4">
                Under UK GDPR Article 6, we must have a lawful basis for processing every piece of personal data. We rely on the following bases:
              </p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-sm border border-[#DDD7CB] bg-white">
                  <thead className="bg-[#F1EDE5] text-[#1A1A18] font-semibold">
                    <tr>
                      <th className="p-3 border-b border-[#DDD7CB]">Purpose of Processing</th>
                      <th className="p-3 border-b border-[#DDD7CB]">Personal Data Involved</th>
                      <th className="p-3 border-b border-[#DDD7CB]">Lawful Basis (UK GDPR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD7CB]">
                    <tr>
                      <td className="p-3 font-medium text-[#1A1A18]">Responding to initial enquiries &amp; booking discovery calls</td>
                      <td className="p-3">Name, email, phone, company details, message</td>
                      <td className="p-3"><strong>Pre-contractual steps</strong> (Article 6(1)(b)) taken at your request</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#1A1A18]">Assessing candidate suitability &amp; facilitating introductions</td>
                      <td className="p-3">Candidate background, video link, role, niches, tools</td>
                      <td className="p-3"><strong>Legitimate interests</strong> (Article 6(1)(f)) in running an introduction agency, and <strong>Consent</strong> (Article 6(1)(a))</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#1A1A18]">Maintaining business records &amp; dispute prevention</td>
                      <td className="p-3">Placement records, contact correspondence</td>
                      <td className="p-3"><strong>Legitimate interests</strong> (Article 6(1)(f)) and <strong>Legal obligation</strong> (Article 6(1)(c))</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#1A1A18]">Website security &amp; fraud prevention</td>
                      <td className="p-3">Technical log data, spam prevention fields</td>
                      <td className="p-3"><strong>Legitimate interests</strong> (Article 6(1)(f)) in securing our systems</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Who We Share It With */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                4. Who We Share Your Data With
              </h2>
              <p className="mb-4">
                We treat your details with strict confidentiality. We do not sell, rent, or trade your personal information to third-party marketers or brokers. We share data only with:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong>Introduced Parties:</strong> When an offer owner seeks salespeople, we introduce relevant candidate profiles. Likewise, when a candidate fits an offer, we share relevant offer details. Introductions are made with mutual knowledge.
                </li>
                <li>
                  <strong>Essential Service Providers (Data Processors):</strong> We work with trusted technology providers who process data strictly under our written instructions:
                  <ul className="list-circle pl-5 mt-1 space-y-1 text-sm">
                    <li><strong>Vercel Inc.:</strong> Hosting our website application and executing serverless routines.</li>
                    <li><strong>Google LLC (Google Workspace / Gmail):</strong> Secure business email transmission and inbox hosting.</li>
                  </ul>
                </li>
                <li>
                  <strong>Legal &amp; Regulatory Authorities:</strong> If required by English law, court order, or to protect vital legal rights.
                </li>
              </ul>
            </div>

            {/* 5. International Data Transfers */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                5. International Data Transfers
              </h2>
              <p className="mb-4">
                Our service providers (such as Vercel and Google) maintain secure server infrastructure globally, which may involve transferring data outside the United Kingdom (for example, to the European Economic Area or the United States).
              </p>
              <p>
                Whenever personal data is transferred internationally, we ensure adequate safeguards are in place in compliance with UK GDPR, such as relying on UK Adequacy Regulations, the UK International Data Transfer Agreement (IDTA), or Standard Contractual Clauses (SCCs) alongside appropriate technical measures.
              </p>
            </div>

            {/* 6. How Long We Keep It (Data Retention) */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                6. How Long We Keep Your Data
              </h2>
              <p className="mb-4">
                We keep personal data only for as long as necessary to fulfil the purposes for which it was gathered:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Candidate Applications &amp; Offer Enquiries:</strong> Retained for a maximum of <strong>12 months</strong> from the date of submission. This gives our placement team sufficient opportunity to match candidates with emerging client offers.
                </li>
                <li>
                  <strong>Successful Placements:</strong> If a candidate is successfully placed with an offer owner, relevant introduction and commercial records are retained for up to 6 years following the conclusion of the engagement for tax, accounting, and legal dispute purposes.
                </li>
                <li>
                  <strong>Unmatched or Inactive Submissions:</strong> At or before the end of the 12-month period, or upon your explicit request for erasure, your data is permanently deleted from our records.
                </li>
              </ul>
            </div>

            {/* 7. Security Measures */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                7. Security Measures
              </h2>
              <p className="mb-4">
                We implement appropriate technical and organisational safeguards to prevent unauthorised access, alteration, disclosure, or destruction of your personal data:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>All website traffic and form submissions are transmitted over encrypted TLS/HTTPS connections.</li>
                <li>Administrative access to mailboxes and operational accounts requires multi-factor authentication (MFA).</li>
                <li>Access to candidate profiles and offer metrics is restricted strictly to authorised placement personnel on a need-to-know basis.</li>
              </ul>
            </div>

            {/* 8. Your Legal Rights */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                8. Your Legal Rights Under UK GDPR
              </h2>
              <p className="mb-4">
                As an individual, you have enforceable statutory rights under the UK GDPR and Data Protection Act 2018 regarding the personal data we hold about you:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="card-hairline p-4 bg-white">
                  <h4 className="font-semibold text-[#1A1A18] text-sm mb-1">Right to Access</h4>
                  <p className="text-xs">You may request a copy of the personal information we hold about you (Subject Access Request).</p>
                </div>
                <div className="card-hairline p-4 bg-white">
                  <h4 className="font-semibold text-[#1A1A18] text-sm mb-1">Right to Rectification</h4>
                  <p className="text-xs">You may ask us to correct inaccurate, outdated, or incomplete details.</p>
                </div>
                <div className="card-hairline p-4 bg-white">
                  <h4 className="font-semibold text-[#1A1A18] text-sm mb-1">Right to Erasure</h4>
                  <p className="text-xs">You may ask us to delete your personal data (&ldquo;right to be forgotten&rdquo;) where there is no ongoing legal ground to retain it.</p>
                </div>
                <div className="card-hairline p-4 bg-white">
                  <h4 className="font-semibold text-[#1A1A18] text-sm mb-1">Right to Restriction</h4>
                  <p className="text-xs">You may ask us to suspend processing while you challenge accuracy or lawful basis.</p>
                </div>
                <div className="card-hairline p-4 bg-white">
                  <h4 className="font-semibold text-[#1A1A18] text-sm mb-1">Right to Data Portability</h4>
                  <p className="text-xs">You may request your data in a structured, commonly used, machine-readable format.</p>
                </div>
                <div className="card-hairline p-4 bg-white">
                  <h4 className="font-semibold text-[#1A1A18] text-sm mb-1">Right to Object &amp; Withdraw Consent</h4>
                  <p className="text-xs">You can object to processing based on legitimate interests or withdraw consent at any time without penalty.</p>
                </div>
              </div>
            </div>

            {/* 9. How to Make a Request */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                9. How to Exercise Your Rights
              </h2>
              <p className="mb-4">
                To exercise any of your rights, simply send an email to our data controller at{' '}
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-[#B5632F] underline hover:text-[#9B5325]">
                  {siteConfig.contactEmail}
                </a>{' '}
                stating your name and the nature of your request.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Fee:</strong> Exercising your statutory rights is free of charge.</li>
                <li><strong>Response Time:</strong> We will confirm receipt and provide a full response within <strong>one calendar month</strong> of receiving your request.</li>
                <li><strong>Identity Verification:</strong> To protect your privacy, we may ask you to verify your identity before disclosing records.</li>
              </ul>
            </div>

            {/* 10. Right to Complain to the ICO */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                10. The Right to Complain to the ICO
              </h2>
              <p className="mb-4">
                We take data protection very seriously and will promptly address any concerns. However, if you are unsatisfied with how we have handled your personal information, you have the right to lodge a complaint with the UK supervisory authority:
              </p>
              <div className="card-hairline p-4 bg-white space-y-1 text-sm">
                <p className="font-semibold text-[#1A1A18]">Information Commissioner&rsquo;s Office (ICO)</p>
                <p>
                  <strong>Website:</strong>{' '}
                  <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-[#B5632F] underline inline-flex items-center gap-1">
                    ico.org.uk <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p><strong>Helpline:</strong> 0303 123 1113</p>
                <p><strong>Postal Address:</strong> Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF, United Kingdom</p>
              </div>
            </div>

            {/* 11. Cookies & Tracking */}
            <div className="border-b border-[#DDD7CB] pb-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                11. Cookies and Tracking Technologies
              </h2>
              <p className="mb-4">
                Vox Direct respects your privacy online. This website <strong>does not use any non-essential cookies, third-party advertising cookies, or behavioral tracking scripts</strong>.
              </p>
              <p className="text-sm">
                If our website sets any session tokens or local storage values, they are strictly necessary for basic site operation (such as remembering local form feedback state). Should we introduce analytics in the future, we will update this policy and provide an explicit consent mechanism.
              </p>
            </div>

            {/* 12. Changes to This Policy */}
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-4">
                12. Changes to This Privacy Policy
              </h2>
              <p className="mb-4">
                We may periodically update this policy to reflect operational, legal, or regulatory changes. Any modifications will be posted directly to this page with an updated &ldquo;Last updated&rdquo; timestamp at the top.
              </p>
              <p className="text-sm">
                If you have any questions regarding this Privacy Policy, please email us at{' '}
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-[#B5632F] underline hover:text-[#9B5325]">
                  {siteConfig.contactEmail}
                </a>.
              </p>
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
              onClick={() => onNavigate('terms')}
              className="text-sm text-[#B5632F] hover:underline"
            >
              View Website Terms of Use &rarr;
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
