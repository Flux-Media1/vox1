/**
 * Website copy and placeholder content for Vox Direct
 * Edit this file to update headlines, descriptions, and placeholder text.
 */

export const siteConfig = {
  brandName: 'Vox Direct',
  tagline: 'Sales placement agency',
  headline: 'Sales Placement for Offer Owners, Setters, and Closers',
  oneLineDescription: 'We connect offer owners with appointment setters and closers.',
  contactEmail: 'jc.dev.uk@gmail.com',
  notificationEmail: 'jc.dev.uk@gmail.com',
  instagramUrl: 'https://www.instagram.com/joe.cunliffe_/',
  whatsappNumber: '07488376951',
  whatsappUrl: 'https://wa.me/447488376951',
  location: 'United Kingdom',
};

export const homeContent = {
  hero: {
    title: 'Sales Placement for Offer Owners, Setters, and Closers',
    description: 'We connect offer owners with appointment setters and closers.',
    primaryButtonText: 'I Have an Offer',
    secondaryButtonText: "I'm Looking for an Offer",
  },
  dualCards: {
    owners: {
      title: 'Offer Owners',
      question: 'Looking for appointment setters or closers?',
      description: 'Find dedicated sales professionals matched to your offer and sales process.',
      buttonText: 'View Offer Owners Page',
    },
    seekers: {
      title: 'Offer Seekers',
      question: 'Looking for an offer to sell?',
      description: 'Apply to be placed with vetted offers needing qualified setters or closers.',
      buttonText: 'View Offer Seekers Page',
    },
  },
  howItWorks: {
    heading: 'How It Works',
    subheading: 'A direct placement process for both offer owners and sales talent.',
    forOwners: {
      title: 'For Offer Owners',
      steps: [
        {
          stepNumber: '01',
          title: 'Submit your offer details',
          description:
            'Tell us what you sell, your price point, commission structure, and the type of salesperson you need (setter, closer, or both).',
        },
        {
          stepNumber: '02',
          title: 'Candidate matching',
          description:
            'We review your offer and match you with vetted sales talent whose experience and goals fit your market.',
        },
        {
          stepNumber: '03',
          title: 'Placement and start',
          description:
            'Approve your preferred candidates and they start selling for you, with no hiring process or job boards.',
        },
      ],
    },
    forSeekers: {
      title: 'For Offer Seekers',
      steps: [
        {
          stepNumber: '01',
          title: 'Submit your profile',
          description:
            "Share your sales experience, track record, preferred niches, and the type of role you're looking for.",
        },
        {
          stepNumber: '02',
          title: 'Role alignment',
          description:
            'We compare your profile against open offers so you only see opportunities that suit your skills and earning goals.',
        },
        {
          stepNumber: '03',
          title: 'Direct introduction',
          description:
            'Get introduced straight to the offer owner so you can talk terms and start selling quickly.',
        },
      ],
    },
  },
  testimonials: {
    heading: 'Testimonials',
    placeholderNotice: '[Add testimonials here]',
  },
};

export const offerOwnersContent = {
  title: 'Offer Owners',
  intro:
    'This page is for businesses and offer owners who require appointment setters, closers, or both to manage sales pipeline and client acquisition.',
};

export const offerSeekersContent = {
  title: 'Offer Seekers',
  intro:
    'This page is for experienced appointment setters and closers seeking vetted offers to sell and consistent deal flow.',
};

export const contactContent = {
  title: 'Contact Vox Direct',
  intro: 'Get in touch directly with our team regarding placements, offers, or general enquiries.',
  email: 'contact@voxdirect.co.uk',
};
