/**
 * Data structures for Vox Direct
 * Plain British English types for form submissions and agency state
 */

export type PageId =
  | 'home'
  | 'offer-owners'
  | 'offer-seekers'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'login'
  | 'signup'
  | 'dashboard'
  | '404';

export type UserRole = 'owner' | 'seeker';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  createdAt?: string;
}

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
  hpField?: string;
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
  hpField?: string;
}

export interface ContactSubmission {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  subject?: string;
  message: string;
  hpField?: string;
}
