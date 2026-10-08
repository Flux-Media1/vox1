import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, UserCheck } from 'lucide-react';
import { RoleNeeded, PageId } from '../types';
import { offerSeekersContent } from '../data/content';
import { submissionService } from '../services/submissionService';
import { useAuth } from '../context/AuthContext';

interface OfferSeekersPageProps {
  onNavigateToOwners: () => void;
  onNavigate?: (page: PageId) => void;
}

export const OfferSeekersPage: React.FC<OfferSeekersPageProps> = ({ onNavigateToOwners, onNavigate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    locationAndTimezone: '',
    role: 'both' as RoleNeeded,
    experience: '',
    nichesWorkedIn: '',
    toolsUsed: '',
    portfolioOrVideoLink: '',
    message: '',
    gdprConsent: false,
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
    if (!formData.locationAndTimezone.trim()) {
      newErrors.locationAndTimezone = 'Location and timezone are required (e.g. UK / GMT).';
    }
    if (!formData.experience.trim()) {
      newErrors.experience = 'Please describe your sales background and track record.';
    }
    if (!formData.nichesWorkedIn.trim()) {
      newErrors.nichesWorkedIn = 'Please specify industries or niches you have worked in.';
    }
    if (!formData.toolsUsed.trim()) {
      newErrors.toolsUsed = 'Please list the tools/CRMs you are familiar with.';
    }
    if (!formData.portfolioOrVideoLink.trim()) {
      newErrors.portfolioOrVideoLink = 'Please provide a link to LinkedIn or a video intro.';
    }
    if (!formData.gdprConsent) {
      newErrors.gdprConsent = 'GDPR consent is required to process your application.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await submissionService.submitOfferSeeker({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        locationAndTimezone: formData.locationAndTimezone.trim(),
        role: formData.role,
        experience: formData.experience.trim(),
        nichesWorkedIn: formData.nichesWorkedIn.trim(),
        toolsUsed: formData.toolsUsed.trim(),
        portfolioOrVideoLink: formData.portfolioOrVideoLink.trim(),
        message: formData.message.trim() || undefined,
        gdprConsent: formData.gdprConsent,
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
        locationAndTimezone: '',
        role: 'both',
        experience: '',
        nichesWorkedIn: '',
        toolsUsed: '',
        portfolioOrVideoLink: '',
        message: '',
        gdprConsent: false,
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
              <UserCheck className="h-4 w-4 stroke-[1.5]" />
              <span>Placement For Sales Talent</span>
            </div>
            <button
              onClick={onNavigateToOwners}
              className="text-xs text-[#B9C4BE] hover:text-[#D4895A] flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
            >
              Have an offer and need reps instead?
              <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </button>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.02em] text-[#F4F1EA]">
            {offerSeekersContent.title}
          </h1>
          <p className="mt-4 text-[18px] text-[#B9C4BE] leading-[1.7] max-w-3xl">
            {offerSeekersContent.intro}
          </p>
        </div>
      </section>

      {/* Main Content: Application Form */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="card-hairline p-8 sm:p-12">
            <div className="border-b border-[#DDD7CB] pb-6 mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#B5632F] mb-2">
                <span className="w-4 h-px bg-[#B5632F]" aria-hidden="true" />
                <span>Candidate Registration</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#1A1A18]">
                Apply for Placement
              </h2>
              <p className="mt-2 text-[15px] text-[#4A4A44]">
                Submit your profile and background to be matched with vetted offers looking for appointment setters and closers.
              </p>
            </div>

            {submittedSuccess ? (
              <div className="border border-[#DDD7CB] bg-[#F1EDE5] p-8 text-center space-y-4 rounded">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0F2A24] text-[#F4F1EA]">
                  <CheckCircle2 className="h-5 w-5 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-xl font-normal text-[#1A1A18]">
                  Application Submitted Successfully
                </h3>
                {isLiveDelivery ? (
                  <p className="text-[15px] text-[#4A4A44] max-w-md mx-auto leading-relaxed">
                    A confirmation email has been dispatched to{' '}
                    <strong className="text-[#1A1A18]">{deliveredEmails.submitter}</strong>, and an alert notification has been delivered to our placement team at{' '}
                    <strong className="text-[#1A1A18]">{deliveredEmails.admin}</strong>.
                  </p>
                ) : (
                  <p className="text-[15px] text-[#4A4A44] max-w-md mx-auto leading-relaxed">
                    Your candidate application has been safely received for{' '}
                    <strong className="text-[#1A1A18]">{deliveredEmails.submitter}</strong>. Our placement team will review your background and reach out soon.
                  </p>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="btn-secondary-light !py-2.5 !px-5 text-xs"
                  >
                    Submit Another Application
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
                      Candidate Session
                    </span>
                  </div>
                )}

                {/* Row 1: Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="seeker-name" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="seeker-name"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Thomas Wright"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label htmlFor="seeker-email" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="seeker-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. thomas@closerhub.co.uk"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                  </div>
                </div>

                {/* Row 2: Phone & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="seeker-phone" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Phone Number / WhatsApp <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="seeker-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +44 7987 654321"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="seeker-location" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Location & Timezone <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="seeker-location"
                      type="text"
                      value={formData.locationAndTimezone}
                      onChange={(e) => setFormData({ ...formData, locationAndTimezone: e.target.value })}
                      placeholder="e.g. Manchester, UK (GMT)"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.locationAndTimezone ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.locationAndTimezone && <p className="mt-1 text-xs text-rose-600">{errors.locationAndTimezone}</p>}
                  </div>
                </div>

                {/* Role Selected */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-2">
                    What sales role are you applying for? <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'setter', label: 'Appointment Setter', desc: 'Outbound / inbound lead qualification' },
                      { id: 'closer', label: 'Closer', desc: 'Discovery & high-ticket closer' },
                      { id: 'both', label: 'Both / Hybrid', desc: 'Experienced in setting & closing' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex flex-col p-4 rounded border cursor-pointer transition-colors ${
                          formData.role === opt.id
                            ? 'border-[#B5632F] bg-[#F1EDE5]'
                            : 'border-[#DDD7CB] bg-white hover:border-[#B5632F]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#1A1A18]">{opt.label}</span>
                          <input
                            type="radio"
                            name="role"
                            value={opt.id}
                            checked={formData.role === opt.id}
                            onChange={() => setFormData({ ...formData, role: opt.id as RoleNeeded })}
                            className="text-[#B5632F] focus:ring-[#B5632F]"
                          />
                        </div>
                        <span className="text-xs text-[#4A4A44]">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sales Experience */}
                <div>
                  <label htmlFor="seeker-experience" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                    Sales Experience & Track Record <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="seeker-experience"
                    rows={4}
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="Briefly state your closing or setting experience, total revenue generated or calls booked, and past offer types."
                    className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                      errors.experience ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                    }`}
                  />
                  {errors.experience && <p className="mt-1 text-xs text-rose-600">{errors.experience}</p>}
                </div>

                {/* Niches and Tools */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="seeker-niches" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Niches / Markets Worked In <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="seeker-niches"
                      type="text"
                      value={formData.nichesWorkedIn}
                      onChange={(e) => setFormData({ ...formData, nichesWorkedIn: e.target.value })}
                      placeholder="e.g. Marketing agencies, SaaS, Consulting"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.nichesWorkedIn ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.nichesWorkedIn && <p className="mt-1 text-xs text-rose-600">{errors.nichesWorkedIn}</p>}
                  </div>

                  <div>
                    <label htmlFor="seeker-tools" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      CRM & Sales Tools Familiar With <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="seeker-tools"
                      type="text"
                      value={formData.toolsUsed}
                      onChange={(e) => setFormData({ ...formData, toolsUsed: e.target.value })}
                      placeholder="e.g. HubSpot, GoHighLevel, Close, Slack"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.toolsUsed ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.toolsUsed && <p className="mt-1 text-xs text-rose-600">{errors.toolsUsed}</p>}
                  </div>
                </div>

                {/* Portfolio / Video Intro */}
                <div>
                  <label htmlFor="seeker-portfolio" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                    LinkedIn URL or Video Intro (Loom) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="seeker-portfolio"
                    type="url"
                    value={formData.portfolioOrVideoLink}
                    onChange={(e) => setFormData({ ...formData, portfolioOrVideoLink: e.target.value })}
                    placeholder="https://linkedin.com/in/... or Loom link"
                    className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                      errors.portfolioOrVideoLink ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                    }`}
                  />
                  {errors.portfolioOrVideoLink && <p className="mt-1 text-xs text-rose-600">{errors.portfolioOrVideoLink}</p>}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="seeker-message" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                    Availability / Additional Notes <span className="text-stone-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    id="seeker-message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="When can you start? Are you looking for full-time or part-time volume?"
                    className="w-full rounded border border-[#DDD7CB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 focus:outline-none focus:border-[#B5632F]"
                  />
                </div>

                {/* GDPR Consent */}
                <div className="border border-[#DDD7CB] bg-[#F1EDE5] p-4 rounded">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gdprConsent}
                      onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded text-[#B5632F] focus:ring-[#B5632F]"
                    />
                    <span className="text-xs text-[#4A4A44] leading-relaxed">
                      I agree that Vox Direct may store my candidate details and contact me regarding verified offer placement opportunities in accordance with the{' '}
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
                    </span>
                  </label>
                  {errors.gdprConsent && <p className="mt-2 text-xs text-rose-600">{errors.gdprConsent}</p>}
                </div>

                {/* Honeypot spam protection (hidden off-screen for real users) */}
                <div className="absolute -left-[9999px] top-auto opacity-0 w-px h-px pointer-events-none" aria-hidden="true">
                  <label htmlFor="seeker-hpField">Leave this field blank</label>
                  <input
                    id="seeker-hpField"
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
                      {isSubmitting ? 'Submitting Application...' : 'Apply for Placement'}
                    </button>
                    <span className="text-xs text-[#4A4A44] font-mono">
                      Strictly confidential candidate matching
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
