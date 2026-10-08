/**
 * Submission Service for Vox Direct
 *
 * Transmits form submissions directly to the notification email address
 * and stores a persistent copy locally and via optional webhooks.
 */

import { OfferOwnerSubmission, OfferSeekerSubmission, ContactSubmission } from '../types';
import { siteConfig } from '../data/content';

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
 * Sends formatted email notification via the server-side /api/send-email endpoint
 * Dispatches BOTH:
 * 1. Confirmation email to the submitter's email address
 * 2. Lead alert email to the site owner (jc.dev.uk@gmail.com)
 */
async function sendEmailNotification(
  type: 'offer_owner' | 'offer_seeker' | 'contact',
  data: unknown
): Promise<{ success: boolean; isLive: boolean; provider: string; deliveredToAdmin: string; deliveredToSubmitter: string }> {
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
    return {
      success: false,
      isLive: false,
      provider: 'failed',
      deliveredToAdmin: siteConfig.notificationEmail,
      deliveredToSubmitter: '',
    };
  } catch (err) {
    console.warn('Network error attempting /api/send-email dispatch:', err);
    return {
      success: false,
      isLive: false,
      provider: 'failed',
      deliveredToAdmin: siteConfig.notificationEmail,
      deliveredToSubmitter: '',
    };
  }
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

    // 1. Send to email address
    const emailResult = await sendEmailNotification('offer_owner', entry);

    // 2. Forward to external webhook if configured
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

    // 1. Send to email address
    const emailResult = await sendEmailNotification('offer_seeker', entry);

    // 2. Forward to external webhook if configured
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
