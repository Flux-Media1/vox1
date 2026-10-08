# Vox Direct — Sales Placement Agency Website

A clean, minimalist, mobile-responsive website for **Vox Direct**, connecting offer owners with appointment setters and closers.

---

## 1. How to Change Text & Placeholders

All main copy, headlines, and placeholder texts are organised in **`src/data/content.ts`**:

- **Brand & Global Details**: `siteConfig.brandName`, `siteConfig.contactEmail`, `siteConfig.headline`.
- **Home Page Copy**: `homeContent` (Hero headline, dual-card text, "How It Works" 3 steps for offer owners and seekers, and the testimonials placeholder).
- **Offer Owners Page**: `offerOwnersContent` (Intro and sections for *"How we work"*, *"What we need from you"*, and *"Terms"*).
- **Offer Seekers Page**: `offerSeekersContent` (Intro and sections for *"How we work"*, *"What we look for"*, and *"Terms"*).
- **Contact Page**: `contactContent` (Email, intro note).

To replace any placeholder marked `[Add text here]` or `[Add testimonials here]`, simply open `src/data/content.ts` and replace the string with your finalized copy.

---

## 2. How to Change Colours

The design follows a minimal palette: **white background**, **dark navy/slate text (`#0f172a`)**, and **one accent blue colour (`#1d4ed8` / `bg-blue-700`)**.

- **Accent Colour**:
  - The accent blue classes used across components are:
    - Backgrounds: `bg-blue-700` (hover: `hover:bg-blue-800`), `bg-blue-50` (subtle badges/tags)
    - Text: `text-blue-700`
    - Borders: `border-blue-600`
  - To change to another accent (e.g. emerald, indigo, cobalt, or black):
    - Search for `blue-700`, `blue-600`, `blue-50` across `src/` and replace with your preferred color (e.g., `emerald-700`, `indigo-700`, etc.).
- **Typography & Background**:
  - Base colors are defined in `src/index.css` (`body: #ffffff; text: #0f172a`).

---

## 3. Email Delivery for Form Submissions

Whenever an **Offer Owner**, **Offer Seeker**, or **Contact** form is submitted, it is automatically formatted and sent to your configured email address: **`jc.dev.uk@gmail.com`**.

### How it works:
1. **Server Endpoint**: `/api/send-email` (configured in `server.ts`).
2. **Target Email**: Configured in `src/data/content.ts` (`siteConfig.notificationEmail`) and via `NOTIFICATION_EMAIL="jc.dev.uk@gmail.com"` in `.env`.
3. **Live Delivery Providers**:
   - **Resend (Recommended & Instant)**: Add `RESEND_API_KEY="re_..."` to `.env`. Resend delivers instantly to your inbox.
   - **SMTP (Gmail, SendGrid, Amazon SES, Postmark)**: Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in `.env`.
   - **Formspree / Web3Forms**: You can also route directly via `WEBHOOK_URL` in `src/services/submissionService.ts`.
4. **Email Logs & Live Inspection**:
   - Click **"Submissions (Vox Direct)"** in the website footer.
   - The **"Dispatched Emails"** tab displays all generated emails sent to `jc.dev.uk@gmail.com`, showing the full HTML formatted layout, timestamps, and details.

---

## 4. How to Connect Forms to Google Sheets, Airtable, or a CRM

Form submissions are managed cleanly in **`src/services/submissionService.ts`**.

Currently, all submissions are saved to **`localStorage`** so they persist in browser tests. You can inspect submissions anytime by clicking **"Submissions (Vox Direct)"** in the website footer.

### Option A: Webhook (Zapier / Make.com / Pabbly)
1. In Zapier or Make, create a **Catch Hook** trigger.
2. In `src/services/submissionService.ts`, set the `WEBHOOK_URL` constant:
   ```ts
   const WEBHOOK_URL: string | null = "https://hook.eu1.make.com/your-custom-webhook-id";
   ```
3. Whenever a visitor submits either form (Offer Owner, Offer Seeker, or Contact), the JSON payload is automatically POSTed to your webhook, which can forward it to:
   - Google Sheets
   - Airtable
   - HubSpot / GoHighLevel / Close / Notion
   - Slack / Discord notifications

### Option B: Google Sheets Direct
1. Create a Google Sheet.
2. Under **Extensions → Apps Script**, paste a simple `doPost(e)` script that appends rows.
3. Deploy as a Web App (Access: Anyone).
4. Put the Web App URL into `WEBHOOK_URL` in `src/services/submissionService.ts`.

### Option C: Airtable Direct API
In `submissionService.ts`, you can add a direct POST request to `https://api.airtable.com/v0/{baseId}/{tableId}` with your Airtable Personal Access Token in the `Authorization` header.

---

## 4. Voice Testimonials & shadcn/ui Structure

The codebase is configured with **shadcn project structure** (`components.json`), **Tailwind CSS**, and **TypeScript**:

- **Default Component Path**: `/components/ui/` (aliased as `@/components/ui/`) is the canonical path for atomic/primitive UI components, ensuring compatibility with shadcn CLI and 21st.dev components.
- **Voice Testimonial Component**: Located in `/components/ui/voice-testimonial.tsx` and demo file in `/components/ui/demo.tsx`.
- **Next.js Image Compatibility**: `next/image` is shimmed via `/src/components/ui/NextImage.tsx` with Vite and TypeScript alias mappings so Next.js components work in Vite React without external Next runtime dependencies.
- **Adding Testimonials**: Visitors and team members can click **"+ Add a Testimonial"** directly on the home page. The modal allows setting their name, role, feedback text, avatar, and recording a voice note with their microphone or uploading an audio clip. Submissions persist across page reloads in `localStorage`.

---

## 5. How to Add Form Fields or Modify Forms

- **Offer Owners Form**: Located in `src/pages/OfferOwnersPage.tsx`. Form inputs, state, and validation are in plain React state (`formData` and `validate()`).
- **Offer Seekers Form**: Located in `src/pages/OfferSeekersPage.tsx`. Includes candidate fields and the GDPR consent checkbox.
- **Contact Form**: Located in `src/pages/ContactPage.tsx`.
- **Types**: Located in `src/types/index.ts`. Add new fields to `OfferOwnerSubmission` or `OfferSeekerSubmission` if you add new form fields.

---

## 5. Running the Project

```bash
# Start development server
npm run dev

# Build for production
npm run build
```
