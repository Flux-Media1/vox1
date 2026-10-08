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
  | 'admin'
  | '404';

export type UserRole = 'owner' | 'seeker' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  isAdmin?: boolean;
  createdAt?: string;
}

export type ApplicationRoleType = 'offer_owner' | 'candidate';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface ApplicationRecord {
  id: string;
  user_id?: string | null;
  userId?: string | null;
  role_type: ApplicationRoleType;
  full_name: string;
  email: string;
  user_email?: string;
  phone?: string;
  details: Record<string, any>;
  status: ApplicationStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type MessageSenderRole = 'admin' | 'applicant';

export interface MessageRecord {
  id: string;
  application_id: string | null;
  recipient_user_id?: string | null;
  sender_email: string;
  sender_role: MessageSenderRole;
  content: string;
  is_read: boolean;
  created_at: string;
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
