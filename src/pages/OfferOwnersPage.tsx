import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Building2, UserCheck } from 'lucide-react';
import { RoleNeeded, PageId } from '../types';
import { offerOwnersContent } from '../data/content';
import { submissionService } from '../services/submissionService';
import { useAuth } from '../context/AuthContext';

interface OfferOwnersPageProps {
  onNavigateToSeekers: () => void;
  onNavigate?: (page: PageId) => void;
}

export const OfferOwnersPage: React.FC<OfferOwnersPageProps> = ({ onNavigateToSeekers, onNavigate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    company: '',
    website: '',
    offerDescription: '',
    roleNeeded: 'both' as RoleNeeded,
    commissionStructure: '',
    expectedVolume: '',
    message: '',
  });

  // Pre-fill user information when user profile loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email || '',
        fullName: prev.fullName || user.fullName || '',
      }));
    }
  }, [user]);

  const [hpField, setHpField] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [deliveredEmails, setDeliveredEmails] = useState<{ submitter: string; admin: string }>({
    submitter: '',
    admin: '',
  });
  const [isLiveDelivery, setIsLiveDelivery] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!formData.company.trim()) newErrors.company = 'Company name is required.';
    if (!formData.offerDescription.trim()) newErrors.offerDescription = 'Please describe your offer.';
    if (!formData.commissionStructure.trim()) newErrors.commissionStructure = 'Please specify your commission or compensation model.';
    if (!formData.expectedVolume.trim()) newErrors.expectedVolume = 'Please indicate your expected lead or call volume.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await submissionService.submitOfferOwner({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        website: formData.website.trim() || undefined,
        offerDescription: formData.offerDescription.trim(),
        roleNeeded: formData.roleNeeded,
        commissionStructure: formData.commissionStructure.trim(),
        expectedVolume: formData.expectedVolume.trim(),
        message: formData.message.trim() || undefined,
        hpField: hpField || undefined,
      });

      setDeliveredEmails({
        submitter: res.deliveredToSubmitter || formData.email.trim(),
        admin: res.deliveredToAdmin,
      });
      setIsLiveDelivery(res.isLive);
      setSubmittedSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        website: '',
        offerDescription: '',
        roleNeeded: 'both',
        commissionStructure: '',
        expectedVolume: '',
        message: '',
      });
      setHpField('');
      setErrors({});
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F4] text-[#4A4A44]">
      {/* Header & Intro (Deep Ink Green #0F2A24) */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-20 md:py-24 border-b border-[#2A453D]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A]">
              <span className="w-5 h-px bg-[#D4895A]" aria-hidden="true" />
              <Building2 className="h-4 w-4 stroke-[1.5]" />
              <span>Placement For Offer Owners</span>
            </div>
            <button
              onClick={onNavigateToSeekers}
              className="text-xs text-[#B9C4BE] hover:text-[#D4895A] flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
            >
              Looking for an offer to sell instead?
              <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </button>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.02em] text-[#F4F1EA]">
            {offerOwnersContent.title}
          </h1>
          <p className="mt-4 text-[18px] text-[#B9C4BE] leading-[1.7] max-w-3xl">
            {offerOwnersContent.intro}
          </p>
        </div>
      </section>

      {/* Main Content: Form */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="card-hairline p-8 sm:p-12">
            <div className="border-b border-[#DDD7CB] pb-6 mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-2">
                <span className="w-4 h-px bg-[#B5632F]" aria-hidden="true" />
                <span>Offer Intake</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#1A1A18]">
                Submit Your Offer Details
              </h2>
              <p className="mt-2 text-[15px] text-[#4A4A44]">
                Complete the fields below to register your requirements. We review your pipeline model and introduce vetted sales reps directly.
              </p>
            </div>

            {submittedSuccess ? (
              <div className="border border-[#DDD7CB] bg-[#F1EDE5] p-8 text-center space-y-4 rounded">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0F2A24] text-[#F4F1EA]">
                  <CheckCircle2 className="h-5 w-5 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#1A1A18]">
                  Offer Details Submitted Successfully
                </h3>
                {isLiveDelivery ? (
                  <p className="text-[15px] text-[#4A4A44] max-w-md mx-auto leading-relaxed">
                    A confirmation email has been dispatched to{' '}
                    <strong className="text-[#1A1A18]">{deliveredEmails.submitter}</strong>, and an alert notification has been delivered to{' '}
                    <strong className="text-[#1A1A18]">{deliveredEmails.admin}</strong>.
                  </p>
                ) : (
                  <p className="text-[15px] text-[#4A4A44] max-w-md mx-auto leading-relaxed">
                    Your offer requirements have been safely received for{' '}
                    <strong className="text-[#1A1A18]">{deliveredEmails.submitter}</strong>. Our team will review your requirements and be in touch shortly.
                  </p>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="btn-secondary-light !py-2.5 !px-5 text-xs"
                  >
                    Submit Another Offer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {user && (
                  <div className="p-3.5 rounded bg-[#F1EDE5] border border-[#DDD7CB] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A4A44]">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#B5632F]" />
                      <span>
                        Verified Account: <strong className="text-[#1A1A18] font-mono">{user.email}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#B5632F] uppercase tracking-wider bg-[#FAF3EE] px-2 py-0.5 rounded border border-[#B5632F]/20">
                      Offer Owner Session
                    </span>
                  </div>
                )}

                {/* Row 1: Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="owner-name" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="owner-name"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. David Harrison"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label htmlFor="owner-email" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Work Email <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="owner-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. david@scaleagency.co.uk"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                  </div>
                </div>

                {/* Row 2: Phone & Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="owner-phone" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Phone Number / WhatsApp <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="owner-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +44 7123 456789"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="owner-company" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Company / Business Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="owner-company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex Digital Growth"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.company ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.company && <p className="mt-1 text-xs text-rose-600">{errors.company}</p>}
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="owner-website" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                    Company Website <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="owner-website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.co.uk"
                    className="w-full rounded border border-[#DDD7CB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 focus:outline-none focus:border-[#B5632F]"
                  />
                </div>

                {/* Role Needed */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-2">
                    What sales roles do you require? <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'setter', label: 'Appointment Setter', desc: 'Outbound qualification & booking' },
                      { id: 'closer', label: 'Closer', desc: 'Discovery & high-ticket sales calls' },
                      { id: 'both', label: 'Both Roles', desc: 'Complete sales pipeline support' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex flex-col p-4 rounded border cursor-pointer transition-colors ${
                          formData.roleNeeded === opt.id
                            ? 'border-[#B5632F] bg-[#F1EDE5]'
                            : 'border-[#DDD7CB] bg-white hover:border-[#B5632F]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#1A1A18]">{opt.label}</span>
                          <input
                            type="radio"
                            name="roleNeeded"
                            value={opt.id}
                            checked={formData.roleNeeded === opt.id}
                            onChange={() => setFormData({ ...formData, roleNeeded: opt.id as RoleNeeded })}
                            className="text-[#B5632F] focus:ring-[#B5632F]"
                          />
                        </div>
                        <span className="text-xs text-[#4A4A44]">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Offer Description */}
                <div>
                  <label htmlFor="owner-offer" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                    What is your offer & price point? <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="owner-offer"
                    rows={4}
                    value={formData.offerDescription}
                    onChange={(e) => setFormData({ ...formData, offerDescription: e.target.value })}
                    placeholder="Describe what you sell, your target market, ticket price, and current lead flow."
                    className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                      errors.offerDescription ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                    }`}
                  />
                  {errors.offerDescription && <p className="mt-1 text-xs text-rose-600">{errors.offerDescription}</p>}
                </div>

                {/* Commission structure & Expected volume */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="owner-commission" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Commission Structure <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="owner-commission"
                      type="text"
                      value={formData.commissionStructure}
                      onChange={(e) => setFormData({ ...formData, commissionStructure: e.target.value })}
                      placeholder="e.g. 10% on closed deals or £X per booked call"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.commissionStructure ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.commissionStructure && <p className="mt-1 text-xs text-rose-600">{errors.commissionStructure}</p>}
                  </div>

                  <div>
                    <label htmlFor="owner-volume" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Expected Lead / Call Volume <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="owner-volume"
                      type="text"
                      value={formData.expectedVolume}
                      onChange={(e) => setFormData({ ...formData, expectedVolume: e.target.value })}
                      placeholder="e.g. 20–30 qualified leads weekly"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.expectedVolume ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.expectedVolume && <p className="mt-1 text-xs text-rose-600">{errors.expectedVolume}</p>}
                  </div>
                </div>

                {/* Additional message */}
                <div>
                  <label htmlFor="owner-message" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                    Additional Message or Notes <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    id="owner-message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Any specific software requirements, onboarding details, or schedule preferences."
                    className="w-full rounded border border-[#DDD7CB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 focus:outline-none focus:border-[#B5632F]"
                  />
                </div>

                {/* Honeypot spam protection (hidden off-screen for real users) */}
                <div className="absolute -left-[9999px] top-auto opacity-0 w-px h-px pointer-events-none" aria-hidden="true">
                  <label htmlFor="owner-hpField">Leave this field blank</label>
                  <input
                    id="owner-hpField"
                    type="text"
                    name="hpField"
                    tabIndex={-1}
                    autoComplete="off"
                    value={hpField}
                    onChange={(e) => setHpField(e.target.value)}
                  />
                </div>

                {/* Submit CTA & Consent Notice */}
                <div className="pt-6 border-t border-[#DDD7CB] space-y-4">
                  <p className="text-xs text-[#8A9A92] leading-relaxed">
                    By submitting this form you agree that Vox Direct may use your details to respond to your enquiry and, where relevant, introduce you to suitable parties, as described in our{' '}
                    <a
                      href="/privacy"
                      onClick={(e) => {
                        if (onNavigate) {
                          e.preventDefault();
                          onNavigate('privacy');
                        }
                      }}
                      className="text-[#B5632F] underline hover:text-[#9B5325]"
                    >
                      Privacy Policy
                    </a>.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary-light w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting Details...' : 'Submit Offer Details'}
                    </button>
                    <span className="text-xs text-[#4A4A44] font-mono">
                      Direct notification to placement desk
                    </span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
