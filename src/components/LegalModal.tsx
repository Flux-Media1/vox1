import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
    >
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 id="legal-modal-title" className="text-xl font-bold tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Vox Direct · United Kingdom</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5 text-sm text-slate-600 leading-relaxed">
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <span className="font-mono text-xs font-medium text-slate-600 block mb-1">
              [Placeholder Document]
            </span>
            <p className="font-mono text-xs text-slate-500 italic">
              [Add {isPrivacy ? 'Privacy Policy' : 'Terms of Service'} text here]
            </p>
          </div>

          <section>
            <h4 className="font-semibold text-slate-900 mb-1">1. Scope</h4>
            <p className="font-mono text-xs text-slate-500 italic">[Add text here]</p>
          </section>

          <section>
            <h4 className="font-semibold text-slate-900 mb-1">
              {isPrivacy ? '2. Data Collection & GDPR Compliance' : '2. Candidate Placement & Engagement'}
            </h4>
            <p className="font-mono text-xs text-slate-500 italic">[Add text here]</p>
          </section>

          <section>
            <h4 className="font-semibold text-slate-900 mb-1">
              {isPrivacy ? '3. Data Retention & Deletion' : '3. Confidentiality & Non-Circumvention'}
            </h4>
            <p className="font-mono text-xs text-slate-500 italic">[Add text here]</p>
          </section>

          <section>
            <h4 className="font-semibold text-slate-900 mb-1">4. Governing Law</h4>
            <p className="font-mono text-xs text-slate-500 italic">[Add text here: England and Wales jurisdiction]</p>
          </section>
        </div>

        <div className="mt-8 flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
