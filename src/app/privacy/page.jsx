"use client";

import React, { useEffect, useState } from "react";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("introduction");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 },
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Adjust offset for fixed header
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
    }
  };

  const TableOfContents = () => (
    <nav className="space-y-1">
      <ul className="space-y-2 text-sm list-disc">
        <li>
          <a
            href="#introduction"
            onClick={(e) => scrollToSection(e, "introduction")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "introduction"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Introduction
          </a>
        </li>
        <li>
          <a
            href="#definitions"
            onClick={(e) => scrollToSection(e, "definitions")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "definitions"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Definitions
          </a>
        </li>
        <li>
          <a
            href="#collection"
            onClick={(e) => scrollToSection(e, "collection")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "collection"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Information Collection
          </a>
        </li>
        <li>
          <a
            href="#types"
            onClick={(e) => scrollToSection(e, "types")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "types"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Types of Data Collected
          </a>
        </li>
        {/* Add more TOC items as we add more sections from the user request if needed, 
            but for now matching the existing content */}
      </ul>
    </nav>
  );

  return (
    <div className="w-full md:max-w-[80%] mx-auto px-4 md:px-8 pt-[140px] pb-12 md:pb-20 lg:pb-24">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
        {/* Sidebar / Table of Contents - Hidden on small mobile, visible on desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-28">
            <TableOfContents />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl">
          <h1 className="text-[32px] font-bold leading-6 tracking-normal text-[#000000] mb-8">
            Privacy and Policy
          </h1>

          <div className="space-y-12 text-gray-700 font-sans">
            {/* 1. Introduction */}
            <section id="introduction" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                1. Introduction
              </h2>
              <div className="space-y-4 text-[#14142D] text-base font-normal leading-6 tracking-normal">
                <p>
                  Welcome to <strong>Zemuria Inc.</strong>
                </p>
                <p>
                  Zemuria Inc. (“us”, “we”, or “our”) operates
                  https://zemuria.com and https://zemuria.io applications
                  (hereinafter referred to as “Service”).
                </p>
                <p>
                  Our Privacy Policy governs your visit to https://zemuria.com
                  and https://zemuria.io applications and explains how we
                  collect, safeguard and disclose information that results from
                  your use of our Service.
                </p>
                <p>
                  We use your data to provide and improve Service. By using
                  Service, you agree to the collection and use of information in
                  accordance with this policy. Unless otherwise defined in this
                  Privacy Policy, the terms used in this Privacy Policy have the
                  same meanings as in our Terms and Conditions.
                </p>
                <p>
                  Our Terms and Conditions (“Terms”) govern all use of our
                  Service and together with the Privacy Policy constitute your
                  agreement with us (“Agreement”).
                </p>
              </div>
            </section>

            {/* 2. Definitions */}
            <section id="definitions" className="scroll-mt-28">
              <h2 className="font-bold text-xl md:text-2xl text-black mb-4">
                2. Definitions
              </h2>
              <ul className="space-y-4 text-[#14142D] text-base font-normal leading-6 tracking-normal">
                <li>
                  <strong>SERVICE</strong> means the https://zemuria.com website
                  and https://zemuria.io applications, products, and services
                  operated by Zemuria Inc.
                </li>
                <li>
                  <strong>PERSONAL DATA</strong> means data about a living
                  individual who can be identified from those data (or from
                  those and other information either in our possession or likely
                  to come into our possession).
                </li>
                <li>
                  <strong>USAGE DATA</strong> is data collected automatically
                  either generated by the use of Service or from the Service
                  infrastructure itself (for example, the duration of a page
                  visit).
                </li>
                <li>
                  <strong>COOKIES</strong> are small files stored on your device
                  (computer or mobile device).
                </li>
                <li>
                  <strong>DATA CONTROLLER</strong> means a natural or legal
                  person who (either alone or jointly or in common with other
                  persons) determines the purposes for which and the manner in
                  which any personal data are, or are to be, processed. For the
                  purpose of this Privacy Policy, we are a Data Controller of
                  your data.
                </li>
                <li>
                  <strong>DATA PROCESSORS (OR SERVICE PROVIDERS)</strong> means
                  any natural or legal person who processes the data on behalf
                  of the Data Controller. We may use the services of various
                  Service Providers in order to process your data more
                  effectively.
                </li>
                <li>
                  <strong>DATA SUBJECT</strong> is any living individual who is
                  the subject of Personal Data.
                </li>
                <li>
                  <strong>THE USER</strong> is the individual using our Service.
                  The User corresponds to the Data Subject, who is the subject
                  of Personal Data.
                </li>
              </ul>
            </section>

            {/* 3. Information Collection and Use */}
            <section id="collection" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                3. Information Collection and Use
              </h2>
              <p>
                We collect several different types of information for various
                purposes to provide and improve our Service to you.
              </p>
            </section>

            {/* 4. Types of Data Collected */}
            <section id="types" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                4. Types of Data Collected
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-2">
                    Personal Data
                  </h3>
                  <p className="mb-4">
                    While using our Service, we may ask you to provide us with
                    certain personally identifiable information that can be used
                    to contact or identify you (“Personal Data”). Personally,
                    identifiable information may include, but is not limited to:
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>(a) Email address</li>
                    <li>(b) First name and last name</li>
                    <li>(c) Phone number</li>
                    <li>(d) Address, State, Province, ZIP/Postal code, City</li>
                    <li>(e) Cookies and Usage Data</li>
                  </ul>
                  <p>
                    We may use your Personal Data to contact you with
                    newsletters, marketing or promotional materials, and other
                    information that may be of interest to you. You may opt-out
                    of receiving any, or all, of these communications from us by
                    following the unsubscribe link or by emailing us at
                    support@zemuria.com.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-2">
                    Usage Data
                  </h3>
                  <p className="mb-4">
                    We may also collect information that your browser sends
                    whenever you visit our Service or when you access the
                    Service by or through a mobile device (“Usage Data”).
                  </p>
                  <p className="mb-4">
                    This Usage Data may include information such as your
                    computer's Internet Protocol address (e.g. IP address),
                    browser type, browser version, the pages of our Service that
                    you visit, the time and date of your visit, the time spent
                    on those pages, unique device identifiers and other
                    diagnostic data.
                  </p>
                  <p>
                    When you access Service with a mobile device, this Usage
                    Data may include information such as the type of mobile
                    device you use, your mobile device unique ID, the IP address
                    of your mobile device, your mobile operating system, the
                    type of mobile Internet browser you use, unique device
                    identifiers and other diagnostic data.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-2">
                    Location Data
                  </h3>
                  <p className="mb-4">
                    We may use and store information about your location if you
                    give us permission to do so (“Location Data”). We use this
                    data to provide features of our Service, to improve and
                    customize our Service.
                  </p>
                  <p>
                    You can enable or disable location services when you use our
                    Service.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
