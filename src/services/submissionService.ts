/**
 * Submission Service for Vox Direct
 *
 * Transmits form submissions directly to the notification email address
 * and stores a persistent copy locally and via optional webhooks.
 */

import { OfferOwnerSubmission, OfferSeekerSubmission, ContactSubmission } from '../types';
import { siteConfig } from '../data/content';
import { applicationsService } from './applicationsService';

const STORAGE_KEYS = {
  OFFER_OWNERS: 'vox_direct_submissions_offer_owners',
  OFFER_SEEKERS: 'vox_direct_submissions_offer_seekers',
  CONTACT: 'vox_direct_submissions_contact',
};

// Optional: Paste your webhook URL here to also send data to Zapier, Make, Google Sheets, or CRM
const WEBHOOK_URL: string | null = null;

export interface DispatchResult<T> {
  submission: T;
  emailSent: boolean;
  isLive: boolean;
  provider: string;
  deliveredToAdmin: string;
  deliveredToSubmitter: string;
}

/**
 * Sends submission directly via Web3Forms (for static hosts like GitHub Pages
 * where no backend Node.js server is available).
 */
async function sendViaWeb3Forms(
  type: 'offer_owner' | 'offer_seeker' | 'contact',
  data: Record<string, unknown>,
  accessKey: string
): Promise<{ success: boolean; isLive: boolean; provider: string; deliveredToAdmin: string; deliveredToSubmitter: string }> {
  try {
    let subject = `[Vox Direct Alert] New Submission`;
    const payload: Record<string, string> = {
      access_key: accessKey,
      from_name: 'Vox Direct Notifications',
      replyto: String(data.email || siteConfig.notificationEmail),
    };

    if (type === 'offer_owner') {
      subject = `[Vox Direct Alert] New Offer Owner Lead: ${data.fullName || 'Lead'} (${data.company || 'Business'})`;
      payload.subject = subject;
      payload['Submission Type'] = 'Offer Owner Lead';
      payload['Full Name'] = String(data.fullName || '');
      payload['Email'] = String(data.email || '');
      payload['Phone'] = String(data.phone || '');
      payload['Company'] = String(data.company || '');
      if (data.website) payload['Website'] = String(data.website);
      payload['Role Needed'] = String(data.roleNeeded || '');
      payload['Commission Structure'] = String(data.commissionStructure || '');
      payload['Expected Volume'] = String(data.expectedVolume || '');
      payload['Offer Description'] = String(data.offerDescription || '');
      if (data.message) payload['Additional Notes'] = String(data.message);
    } else if (type === 'offer_seeker') {
      subject = `[Vox Direct Alert] New Candidate Application: ${data.fullName || 'Applicant'} (${data.role || 'Role'})`;
      payload.subject = subject;
      payload['Submission Type'] = 'Sales Candidate Application';
      payload['Full Name'] = String(data.fullName || '');
      payload['Email'] = String(data.email || '');
      payload['Phone'] = String(data.phone || '');
      payload['Location & Timezone'] = String(data.locationAndTimezone || '');
      payload['Role Applying For'] = String(data.role || '');
      payload['Video / Portfolio Link'] = String(data.portfolioOrVideoLink || '');
      payload['Sales Experience'] = String(data.experience || '');
      payload['Niches Worked In'] = String(data.nichesWorkedIn || '');
      payload['Tools Used'] = String(data.toolsUsed || '');
      payload['GDPR Consent'] = data.gdprConsent ? 'Confirmed' : 'No';
      if (data.message) payload['Candidate Message'] = String(data.message);
    } else {
      subject = `[Vox Direct Alert] New Contact Enquiry: ${data.fullName || 'Contact'}`;
      payload.subject = subject;
      payload['Submission Type'] = 'Contact Form Message';
      payload['Full Name'] = String(data.fullName || '');
      payload['Email'] = String(data.email || '');
      if (data.phone) payload['Phone'] = String(data.phone);
      if (data.subject) payload['Subject'] = String(data.subject);
      payload['Message'] = String(data.message || '');
    }

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return {
          success: true,
          isLive: true,
          provider: 'web3forms',
          deliveredToAdmin: siteConfig.notificationEmail,
          deliveredToSubmitter: String(data.email || ''),
        };
      }
    }
  } catch (err) {
    console.warn('Web3Forms fallback dispatch encountered an error:', err);
  }

  return {
    success: false,
    isLive: false,
    provider: 'failed',
    deliveredToAdmin: siteConfig.notificationEmail,
    deliveredToSubmitter: '',
  };
}

/**
 * Sends formatted email notification.
 * 1. Attempts the server-side /api/send-email endpoint (active on Node.js / Vercel serverless / dev server).
 * 2. If the endpoint is unavailable (e.g. 404 on static GitHub Pages), automatically uses Web3Forms client-side fallback.
 */
async function sendEmailNotification(
  type: 'offer_owner' | 'offer_seeker' | 'contact',
  data: unknown
): Promise<{ success: boolean; isLive: boolean; provider: string; deliveredToAdmin: string; deliveredToSubmitter: string }> {
  // 1. Try server-side /api/send-email first
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data,
        targetEmail: siteConfig.notificationEmail,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      return {
        success: true,
        isLive: Boolean(json.isLive),
        provider: json.provider || 'simulated',
        deliveredToAdmin: json.deliveredToAdmin || siteConfig.notificationEmail,
        deliveredToSubmitter: json.deliveredToSubmitter || '',
      };
    }
  } catch (err) {
    console.warn('Backend /api/send-email is unreachable (expected on static GitHub Pages hosting):', err);
  }

  // 2. Client-side fallback for static hosting (GitHub Pages linked with custom domain)
  const web3FormsKey =
    siteConfig.web3FormsAccessKey ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WEB3FORMS_ACCESS_KEY);

  if (web3FormsKey && typeof data === 'object' && data !== null) {
    const w3Result = await sendViaWeb3Forms(type, data as Record<string, unknown>, web3FormsKey);
    if (w3Result.success) {
      return w3Result;
    }
  }

  return {
    success: false,
    isLive: false,
    provider: 'static_pending_key',
    deliveredToAdmin: siteConfig.notificationEmail,
    deliveredToSubmitter: '',
  };
}

/**
 * Sends submission to an external webhook (e.g. Zapier / Make / CRM) if configured
 */
async function forwardToWebhook(payloadType: string, data: unknown): Promise<void> {
  if (!WEBHOOK_URL) return;

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'Vox Direct Website',
        type: payloadType,
        timestamp: new Date().toISOString(),
        payload: data,
      }),
    });
  } catch (err) {
    console.error('Failed to forward submission to external webhook:', err);
  }
}

export const submissionService = {
  /**
   * Save an offer owner enquiry and email it to site owner
   */
  async submitOfferOwner(
    data: Omit<OfferOwnerSubmission, 'id' | 'createdAt'>
  ): Promise<DispatchResult<OfferOwnerSubmission>> {
    const entry: OfferOwnerSubmission = {
      ...data,
      id: 'own_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = this.getOfferOwners();
      existing.unshift(entry);
      localStorage.setItem(STORAGE_KEYS.OFFER_OWNERS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }

    // 1. Persist directly to Supabase applications table & local store
    try {
      await applicationsService.createApplication({
        userId: (data as any).userId || null,
        roleType: 'offer_owner',
        fullName: entry.fullName,
        email: entry.email,
        phone: entry.phone,
        details: {
          company: entry.company,
          website: entry.website,
          roleNeeded: entry.roleNeeded,
          commissionStructure: entry.commissionStructure,
          expectedVolume: entry.expectedVolume,
          offerDescription: entry.offerDescription,
          message: entry.message,
        },
      });
    } catch (e) {
      console.warn('Could not persist offer owner to applications table:', e);
    }

    // 2. Send to email address
    const emailResult = await sendEmailNotification('offer_owner', entry);

    // 3. Forward to external webhook if configured
    await forwardToWebhook('offer_owner', entry);

    return {
      submission: entry,
      emailSent: emailResult.success,
      isLive: emailResult.isLive,
      provider: emailResult.provider,
      deliveredToAdmin: emailResult.deliveredToAdmin,
      deliveredToSubmitter: emailResult.deliveredToSubmitter,
    };
  },

  /**
   * Save an offer seeker application and email it to site owner
   */
  async submitOfferSeeker(
    data: Omit<OfferSeekerSubmission, 'id' | 'createdAt'>
  ): Promise<DispatchResult<OfferSeekerSubmission>> {
    const entry: OfferSeekerSubmission = {
      ...data,
      id: 'skr_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = this.getOfferSeekers();
      existing.unshift(entry);
      localStorage.setItem(STORAGE_KEYS.OFFER_SEEKERS, JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }

    // 1. Persist directly to Supabase applications table & local store
    try {
      await applicationsService.createApplication({
        userId: (data as any).userId || null,
        roleType: 'candidate',
        fullName: entry.fullName,
        email: entry.email,
        phone: entry.phone,
        details: {
          locationAndTimezone: entry.locationAndTimezone,
          role: entry.role,
          experience: entry.experience,
          nichesWorkedIn: entry.nichesWorkedIn,
          toolsUsed: entry.toolsUsed,
          portfolioOrVideoLink: entry.portfolioOrVideoLink,
          gdprConsent: entry.gdprConsent,
          message: entry.message,
        },
      });
    } catch (e) {
      console.warn('Could not persist candidate to applications table:', e);
    }

    // 2. Send to email address
    const emailResult = await sendEmailNotification('offer_seeker', entry);

    // 3. Forward to external webhook if configured
    await forwardToWebhook('offer_seeker', entry);

    return {
      submission: entry,
      emailSent: emailResult.success,
      isLive: emailResult.isLive,
      provider: emailResult.provider,
      deliveredToAdmin: emailResult.deliveredToAdmin,
      deliveredToSubmitter: emailResult.deliveredToSubmitter,
    };
  },

  /**
   * Save a general contact message and email it to site owner
   */
  async submitContact(
    data: Omit<ContactSubmission, 'id' | 'createdAt'>
  ): Promise<DispatchResult<ContactSubmission>> {
    const entry: ContactSubmission = {
      ...data,
      id: 'cnt_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = this.getContactMessages();
      existing.unshift(entry);
      localStorage.setItem(STORAGE_KEYS.CONTACT, JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }

    // 1. Send to email address
    const emailResult = await sendEmailNotification('contact', entry);

    // 2. Forward to external webhook if configured
    await forwardToWebhook('contact', entry);

    return {
      submission: entry,
      emailSent: emailResult.success,
      isLive: emailResult.isLive,
      provider: emailResult.provider,
      deliveredToAdmin: emailResult.deliveredToAdmin,
      deliveredToSubmitter: emailResult.deliveredToSubmitter,
    };
  },

  // Readers
  getOfferOwners(): OfferOwnerSubmission[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OFFER_OWNERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getOfferSeekers(): OfferSeekerSubmission[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OFFER_SEEKERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getContactMessages(): ContactSubmission[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONTACT);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.OFFER_OWNERS);
    localStorage.removeItem(STORAGE_KEYS.OFFER_SEEKERS);
    localStorage.removeItem(STORAGE_KEYS.CONTACT);
  },
};
