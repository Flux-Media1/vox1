import React, { useState } from 'react';
import { Mail, Check, Copy, CheckCircle2 } from 'lucide-react';
import { PageId } from '../types';
import { contactContent, siteConfig } from '../data/content';
import { submissionService } from '../services/submissionService';

interface ContactPageProps {
  onNavigate?: (page: PageId) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  const [hpField, setHpField] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
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
    if (!formData.message.trim()) newErrors.message = 'Please enter your message.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(siteConfig.contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await submissionService.submitContact({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
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
        subject: '',
        message: '',
      });
      setHpField('');
      setErrors({});
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F4] text-[#4A4A44]">
      {/* Header (Deep Ink Green #0F2A24) */}
      <section className="bg-[#0F2A24] text-[#F4F1EA] py-20 md:py-24 border-b border-[#2A453D]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4895A] mb-4">
            <span className="w-5 h-px bg-[#D4895A]" aria-hidden="true" />
            <span>Direct Placement Desk</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.02em] text-[#F4F1EA]">
            {contactContent.title}
          </h1>
          <p className="mt-4 text-[18px] text-[#B9C4BE] leading-[1.7] max-w-2xl">
            {contactContent.intro}
          </p>
        </div>
      </section>

      {/* Main Content: Info & Form */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Direct Email Card */}
            <div className="space-y-6">
              <div className="card-hairline p-6">
                <div className="flex items-center gap-2 text-[#B5632F] mb-3">
                  <Mail className="h-4 w-4 stroke-[1.5]" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1A1A18]">
                    Email Address
                  </h3>
                </div>
                <p className="text-xs text-[#4A4A44] mb-4">
                  For direct enquiries, partnership briefs, or general correspondence:
                </p>

                <div className="border border-[#DDD7CB] bg-[#FAF8F4] p-3 flex items-center justify-between gap-2 rounded">
                  <span className="font-mono text-xs text-[#1A1A18] truncate">
                    {siteConfig.contactEmail}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    title="Copy email address"
                    className="p-1 text-[#4A4A44] hover:text-[#B5632F] cursor-pointer"
                  >
                    {copiedEmail ? (
                      <Check className="h-4 w-4 text-[#0F2A24]" />
                    ) : (
                      <Copy className="h-4 w-4 stroke-[1.5]" />
                    )}
                  </button>
                </div>

                <div className="mt-4">
                  <a
                    href={`mailto:${siteConfig.contactEmail}`}
                    className="btn-secondary-light w-full !py-2.5 text-xs text-center"
                  >
                    Open in Mail Client
                  </a>
                </div>
              </div>

              <div className="card-hairline p-6 text-xs text-[#4A4A44] space-y-2">
                <h4 className="font-semibold text-[#1A1A18] uppercase tracking-wider text-[11px]">
                  Office & Hours
                </h4>
                <p>London / United Kingdom</p>
                <p>Monday to Friday: 09:00 – 18:00 GMT</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2 card-hairline p-8 sm:p-10">
              <h2 className="font-serif text-2xl font-normal text-[#1A1A18] mb-1">
                Send a Message
              </h2>
              <p className="text-xs text-[#4A4A44] mb-6">
                All enquiries are answered directly by our placement team.
              </p>

              {submittedSuccess ? (
                <div className="border border-[#DDD7CB] bg-[#F1EDE5] p-8 text-center space-y-3 rounded">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0F2A24] text-[#F4F1EA]">
                    <CheckCircle2 className="h-5 w-5 stroke-[1.5]" />
                  </div>
                  <h3 className="font-serif text-lg font-normal text-[#1A1A18]">
                    Message Sent Successfully
                  </h3>
                  {isLiveDelivery ? (
                    <p className="text-xs text-[#4A4A44] max-w-sm mx-auto leading-relaxed">
                      A confirmation email has been dispatched to{' '}
                      <strong className="text-[#1A1A18]">{deliveredEmails.submitter}</strong>, and an alert notification has been delivered to{' '}
                      <strong className="text-[#1A1A18]">{deliveredEmails.admin}</strong>.
                    </p>
                  ) : (
                    <p className="text-xs text-[#4A4A44] max-w-sm mx-auto leading-relaxed">
                      Your message has been safely received for{' '}
                      <strong className="text-[#1A1A18]">{deliveredEmails.submitter}</strong>. We will get back to you promptly.
                    </p>
                  )}
                  <div className="pt-2">
                    <button
                      onClick={() => setSubmittedSuccess(false)}
                      className="btn-secondary-light !py-2 !px-4 text-xs"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="contact-name"
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
                    <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. david@example.co.uk"
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Subject <span className="text-stone-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Partnership enquiry or question"
                      className="w-full rounded border border-[#DDD7CB] bg-white px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 focus:outline-none focus:border-[#B5632F]"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18] mb-1.5">
                      Message <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help? Detail your enquiry here."
                      className={`w-full rounded border px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder:text-stone-400 bg-white focus:outline-none focus:border-[#B5632F] ${
                        errors.message ? 'border-rose-400 bg-rose-50/20' : 'border-[#DDD7CB]'
                      }`}
                    />
                    {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message}</p>}
                  </div>

                  {/* Honeypot spam protection (hidden off-screen for real users) */}
                  <div className="absolute -left-[9999px] top-auto opacity-0 w-px h-px pointer-events-none" aria-hidden="true">
                    <label htmlFor="contact-hpField">Leave this field blank</label>
                    <input
                      id="contact-hpField"
                      type="text"
                      name="hpField"
                      tabIndex={-1}
                      autoComplete="off"
                      value={hpField}
                      onChange={(e) => setHpField(e.target.value)}
                    />
                  </div>

                  {/* Consent Notice */}
                  <p className="text-xs text-[#8A9A92] leading-relaxed pt-2">
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

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary-light w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
