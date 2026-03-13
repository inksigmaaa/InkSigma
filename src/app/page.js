"use client";

import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Roadmap from "@/components/landing/Roadmap";
import CTA from "@/components/landing/CTA";

export default function Home() {
  return (
    <div className="w-full bg-white mx-auto overflow-hidden">
      <Hero />

      {/* Main content area */}
      <main className="w-full">
        <Features />
      </main>

      <Roadmap />
      <CTA />
    </div>
  );
}
