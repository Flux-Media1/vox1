/**
 * Data structures for Vox Direct
 * Plain British English types for form submissions and agency state
 */

export type PageId = 'home' | 'offer-owners' | 'offer-seekers' | 'contact';

export type RoleNeeded = 'setter' | 'closer' | 'both';

export interface OfferOwnerSubmission {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  website?: string;
  offerDescription: string;
  roleNeeded: RoleNeeded;
  commissionStructure: string;
  expectedVolume: string;
  message?: string;
}

export interface OfferSeekerSubmission {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  locationAndTimezone: string;
  role: RoleNeeded;
  experience: string;
  nichesWorkedIn: string;
  toolsUsed: string;
  portfolioOrVideoLink: string;
  message?: string;
  gdprConsent: boolean;
}

export interface ContactSubmission {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  subject?: string;
  message: string;
}
