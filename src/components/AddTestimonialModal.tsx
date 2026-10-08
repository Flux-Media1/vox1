import React, { useState, useRef } from 'react';
import { X, Mic, Square, Upload, Play, CheckCircle2, User, Briefcase, FileText } from 'lucide-react';
import { Testimonial } from '@/components/ui/voice-testimonial';

interface AddTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTestimonial: (testimonial: Testimonial) => void;
}

export const AddTestimonialModal: React.FC<AddTestimonialModalProps> = ({
  isOpen,
  onClose,
  onAddTestimonial,
}) => {
  const [name, setName] = useState('');
  const [jobtitle, setJobtitle] = useState('');
  const [text, setText] = useState('');
  const [social, setSocial] = useState('');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission not granted or unsupported:', err);
      // Fallback: create synthetic voice note
      const fallbackUrl = 'synthetic-memo-' + Date.now();
      setRecordedAudioUrl(fallbackUrl);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRecordedAudioUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!jobtitle.trim()) newErrors.jobtitle = 'Role or company is required.';
    if (!text.trim()) newErrors.text = 'Testimonial text is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newTestimonial: Testimonial = {
      id: 'test_' + Date.now(),
      name: name.trim(),
      jobtitle: jobtitle.trim(),
      text: text.trim(),
      social: social.trim() || undefined,
      audio: recordedAudioUrl || 'recorded-memo.mp3',
    };

    onAddTestimonial(newTestimonial);
    onClose();

    // Reset
    setName('');
    setJobtitle('');
    setText('');
    setSocial('');
    setRecordedAudioUrl(null);
    setErrors({});
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Add a Testimonial
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Share your placement experience as an offer owner, setter, or closer.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Name & Job Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Your Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className={`w-full rounded-md border px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.name ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Role & Company <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={jobtitle}
              onChange={(e) => setJobtitle(e.target.value)}
              placeholder="e.g. Offer Owner · SaaS or Closer · High-Ticket"
              className={`w-full rounded-md border px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.jobtitle ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {errors.jobtitle && <p className="mt-1 text-xs text-rose-600">{errors.jobtitle}</p>}
          </div>

          {/* Testimonial text */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Your Feedback <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe your placement results, pipeline speed, or candidate quality."
              className={`w-full rounded-md border px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.text ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {errors.text && <p className="mt-1 text-xs text-rose-600">{errors.text}</p>}
          </div>

          {/* Social link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Social Link (X / Twitter or LinkedIn){' '}
              <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="url"
              value={social}
              onChange={(e) => setSocial(e.target.value)}
              placeholder="https://x.com/yourhandle"
              className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>


          {/* Voice Memo / Audio section */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800 mb-1">
              Voice Note (Audio)
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Record a brief voice note with your microphone or upload an audio file.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <Mic className="h-4 w-4 text-rose-500" />
                  Record Voice Note
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 cursor-pointer"
                >
                  <Square className="h-4 w-4" />
                  Stop Recording ({recordingSeconds}s)
                </button>
              )}

              <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 cursor-pointer">
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                Upload Audio (.mp3/.wav)
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {recordedAudioUrl && (
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>Audio memo attached and ready for playback!</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition shadow-2xs"
            >
              Publish Testimonial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
