"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { RiTwitterXLine } from "react-icons/ri";
import { motion, Variants } from "framer-motion";

export type Mode = "light" | "dark";

export interface Testimonial {
  id?: string;
  image?: string;
  name?: string;
  jobtitle?: string;
  text?: string;
  audio?: string;
  social?: string;
}

export interface ComponentProps {
  mode: Mode;
  testimonials: Testimonial[];
  onAddTestimonialClick?: () => void;
  title?: string;
  subtitle?: string;
}

const WaveVariants = (): Variants[] => {
  const waveVariants: Variants[] = [];
  for (let i = 0; i < 30; i++) {
    waveVariants.push({
      initial: {
        scaleY: 1.5,
        transition: {
          duration: 0.5,
        },
      },
      animate: {
        scaleY: [1, Math.random() * 1.2 + 1, 1],
        transition: {
          duration: Math.random() * 0.5 + 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 0.5,
        },
      },
    });
  }
  return waveVariants;
};

const waveVariants = WaveVariants();

export const Component: React.FC<ComponentProps> = ({
  mode,
  testimonials,
  onAddTestimonialClick,
  title = "Read what people are saying",
  subtitle = "Feedback from offer owners and sales representatives using Vox Direct.",
}) => {
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(
    null,
  );
  const [audioElements, setAudioElements] = useState<
    (HTMLAudioElement | null)[]
  >([]);
  const [showAll, setShowAll] = useState(false);
  const synthTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to synthesize simulated audio memo if mp3 file is not on server
  const playSynthesizedMemo = (index: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        // Gentle human voice fundamental tone
        osc.frequency.setValueAtTime(260 + (index % 4) * 40, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 6.0);
      }
    } catch {
      // AudioContext unavailable
    }

    if (synthTimerRef.current) clearTimeout(synthTimerRef.current);
    synthTimerRef.current = setTimeout(() => {
      setCurrentPlayingIndex(null);
    }, 6000);
  };

  useEffect(() => {
    const elements: (HTMLAudioElement | null)[] = [];
    testimonials.forEach((testimonial) => {
      if (testimonial.audio) {
        const audioSrc =
          testimonial.audio.startsWith("http") ||
          testimonial.audio.startsWith("data:") ||
          testimonial.audio.startsWith("blob:")
            ? testimonial.audio
            : `/audio/${testimonial.audio}`;
        try {
          const audio = new Audio(audioSrc);
          audio.addEventListener("ended", handleAudioEnded);
          elements.push(audio);
        } catch {
          elements.push(null);
        }
      } else {
        elements.push(null);
      }
    });
    setAudioElements(elements);

    return () => {
      elements.forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.removeEventListener("ended", handleAudioEnded);
        }
      });
      if (synthTimerRef.current) clearTimeout(synthTimerRef.current);
    };
  }, [testimonials]);

  const handlePlay = (index: number) => {
    if (currentPlayingIndex !== null && currentPlayingIndex !== index) {
      stopAudio(currentPlayingIndex);
    }

    const audio = audioElements[index];
    if (audio) {
      audio
        .play()
        .then(() => {
          setCurrentPlayingIndex(index);
        })
        .catch((error) => {
          console.warn("Audio element playback fallback:", error);
          setCurrentPlayingIndex(index);
          playSynthesizedMemo(index);
        });
    } else {
      setCurrentPlayingIndex(index);
      playSynthesizedMemo(index);
    }
  };

  const stopAudio = (index: number) => {
    const audio = audioElements[index];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (synthTimerRef.current) clearTimeout(synthTimerRef.current);
    setCurrentPlayingIndex(null);
  };

  const handlePause = (index: number) => {
    stopAudio(index);
  };

  const handleAudioEnded = () => {
    setCurrentPlayingIndex(null);
  };

  const handleLoadMore = () => {
    setShowAll(true);
  };

  const openInNewTab = (url: string) => {
    if (!url) return;
    const win = window.open(url, "_blank");
    if (win) {
      win.focus();
    }
  };

  const shouldShowLoadMore = testimonials.length > 6;

  return (
    <div>
      <div className="flex flex-col items-center justify-center pt-5">
        <div className="flex flex-col gap-3 mb-8 text-center max-w-xl mx-auto px-4">
          <span
            className={`text-center text-3xl sm:text-4xl font-bold tracking-tight ${
              mode === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            {title}
          </span>
          <span
            className={`text-center text-sm ${
              mode === "dark" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {subtitle}
          </span>
          {onAddTestimonialClick && testimonials.length > 0 && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={onAddTestimonialClick}
                className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition shadow-2xs cursor-pointer"
              >
                + Add a Testimonial
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        {testimonials.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed p-10 sm:p-14 text-center max-w-2xl mx-auto ${
              mode === "dark"
                ? "border-zinc-800 bg-zinc-950 text-zinc-400"
                : "border-slate-300 bg-white text-slate-500"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Testimonial Section
            </span>
            <p className="font-mono text-sm italic mb-3">
              [No testimonials added yet]
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
              Verified testimonials and voice notes will appear here. Click the button below to add the first testimonial.
            </p>
            {onAddTestimonialClick && (
              <button
                type="button"
                onClick={onAddTestimonialClick}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition shadow-2xs cursor-pointer"
              >
                + Add a Testimonial
              </button>
            )}
          </div>
        ) : (
          <div
            className={`flex justify-center items-center gap-5 flex-wrap overflow-hidden ${
              showAll ? "max-h-full" : "max-h-[720px]"
            } relative`}
          >
            {shouldShowLoadMore && !showAll && (
              <div
                className={`absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t ${
                  mode === "dark"
                    ? "from-black to-transparent"
                    : "from-white to-transparent"
                } z-10 pointer-events-none`}
              ></div>
            )}
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id || index}
                className={`${
                  mode === "dark"
                    ? "bg-black border-zinc-700 text-white"
                    : "bg-white border-slate-200 text-slate-900 shadow-2xs"
                } border w-80 h-auto rounded-2xl p-5 relative transition-all ${
                  !showAll && index >= 6 ? "testimonial-partially-visible" : ""
                }`}
              >
                {testimonial.social && (
                  <div
                    onClick={() => openInNewTab(testimonial.social || "")}
                    className="absolute top-5 right-5"
                  >
                    <RiTwitterXLine
                      className={`${
                        mode === "dark" ? "text-white" : "text-slate-800"
                      } cursor-pointer hover:opacity-75 transition`}
                      size={20}
                    />
                  </div>
                )}
                <div className="flex items-center">
                  {testimonial.image && (
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name || "profile"}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12 mr-3.5 shrink-0"
                    />
                  )}
                  <div className="flex flex-col">
                    <span
                      className={`font-semibold text-sm ${
                        mode === "dark" ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {testimonial.name}
                    </span>
                    <span
                      className={`${
                        mode === "dark" ? "text-zinc-300" : "text-zinc-500"
                      } text-xs`}
                    >
                      {testimonial.jobtitle}
                    </span>
                  </div>
                </div>
                <div className="mt-4 mb-1">
                  <p
                    className={`text-sm leading-relaxed ${
                      mode === "dark" ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    "{testimonial.text}"
                  </p>
                </div>
                <div
                  className={`${
                    mode === "dark" ? "bg-zinc-800" : "bg-slate-100"
                  } w-full h-12 mt-4 rounded-lg flex justify-between items-center p-2 relative`}
                >
                  {currentPlayingIndex !== index ? (
                    <button
                      type="button"
                      onClick={() => handlePlay(index)}
                      aria-label={`Play voice testimonial from ${testimonial.name}`}
                      className="focus:outline-none cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={`${
                          mode === "dark" ? "text-zinc-200" : "text-blue-700"
                        } size-9 hover:scale-105 transition-transform`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePause(index)}
                      aria-label={`Pause voice testimonial from ${testimonial.name}`}
                      className="focus:outline-none cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={`${
                          mode === "dark" ? "text-zinc-200" : "text-blue-700"
                        } size-9 hover:scale-105 transition-transform`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM9 8.25a.75.75 0 0 0-.75.75v6c0 .414.336.75.75.75h.75a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75H9Zm5.25 0a.75.75 0 0 0-.75.75v6c0 .414.336.75.75.75H15a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75h-.75Z"
                        />
                      </svg>
                    </button>
                  )}
                  <div className="flex items-center">
                    {waveVariants.map((variant, i) => (
                      <motion.div
                        key={i}
                        className={`${
                          mode === "dark" ? "bg-zinc-200" : "bg-blue-600"
                        }`}
                        style={{
                          width: "3px",
                          height: `${Math.random() * 20 + 5}px`,
                          margin: "0 2px",
                          borderRadius: "2px",
                        }}
                        variants={variant}
                        initial="initial"
                        animate={
                          currentPlayingIndex === index ? "animate" : "initial"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {shouldShowLoadMore && !showAll && (
          <div className="flex justify-center mt-8">
            <button
              className={`px-5 py-2 rounded-md font-medium text-xs transition cursor-pointer ${
                mode === "dark"
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300"
              }`}
              onClick={handleLoadMore}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Component;
