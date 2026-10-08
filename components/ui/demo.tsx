// This is a demo of a preview
"use client";
import React from "react";
import { Component, Testimonial } from "@/components/ui/voice-testimonial";

export const initialTestimonials: Testimonial[] = [];

export function DemoOne() {
  return (
    <div className="flex w-full min-h-screen justify-center items-center py-12">
      <Component mode="light" testimonials={initialTestimonials} />
    </div>
  );
}

export default DemoOne;
