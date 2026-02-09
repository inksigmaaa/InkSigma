"use client";

import React, { useEffect, useState } from "react";

export default function TermsPage() {
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
            href="#communications"
            onClick={(e) => scrollToSection(e, "communications")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "communications"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Communications
          </a>
        </li>
        <li>
          <a
            href="#purchases"
            onClick={(e) => scrollToSection(e, "purchases")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "purchases"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Purchases
          </a>
        </li>
        <li>
          <a
            href="#contests"
            onClick={(e) => scrollToSection(e, "contests")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "contests"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Contests & Promotions
          </a>
        </li>
        <li>
          <a
            href="#subscriptions"
            onClick={(e) => scrollToSection(e, "subscriptions")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "subscriptions"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Subscriptions
          </a>
        </li>
        <li>
          <a
            href="#freetrial"
            onClick={(e) => scrollToSection(e, "freetrial")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "freetrial"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Free Trial
          </a>
        </li>
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
            Terms and Conditions
          </h1>

          <div className="space-y-12 text-gray-700 font-sans">
            {/* 1. Introduction */}
            <section id="introduction" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                1. Introduction
              </h2>
              <div className="space-y-4">
                <p>
                  Welcome to <strong>Zemuria’s Legal Department</strong>. As you
                  have just clicked on our Terms of Service, please make a
                  pause, grab a cup of coffee and carefully read the following
                  pages. It will take you approximately 20 minutes.
                </p>
                <p>
                  These Terms of Service (“Terms”, “Terms of Service”) govern
                  your use of our web pages located at https://zemuria.com,
                  https://zemuria.io and our services (together or individually
                  “Service”) operated by Zemuria Inc. (the “Company”)
                </p>
                <p>
                  Our Privacy Policy also governs your use of our Service and
                  explains how we collect, safeguard and disclose information
                  that results from your use of our web pages. Please read it
                  here https://zemuria.com/privacy-policy
                </p>
                <p>
                  Your agreement with us includes these Terms and our Privacy
                  Policy (“Agreements”). You acknowledge that you have read and
                  understood Agreements, and agree to be bound by them.
                </p>
                <p>
                  If you do not agree with (or cannot comply with) Agreements,
                  then you may not use the Service or the product, but please
                  let us know by emailing us at support@zemuria.com so we can
                  try to find a solution. These Terms apply to all visitors,
                  users, and others who wish to access or use the Service or the
                  Product.
                </p>
                <p>Thank you for being responsible.</p>
              </div>
            </section>

            {/* 2. Communications */}
            <section id="communications" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                2. Communications
              </h2>
              <p>
                By creating an Account on our Service or Product, you agree to
                subscribe to newsletters, marketing or promotional materials,
                and other information we may send. However, you may opt out of
                receiving any, or all, of these communications from us by
                following the unsubscribe link or by emailing us at
                support@zemuria.com
              </p>
            </section>

            {/* 3. Purchases */}
            <section id="purchases" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                3. Purchases
              </h2>
              <div className="space-y-4">
                <p>
                  If you wish to purchase any product or service made available
                  through Service or the Product (“Purchase”), you may be asked
                  to supply certain information relevant to your Purchase
                  including, without limitation, your credit card or debit card
                  number and other information, the expiration date of your
                  credit card, your billing address, and your shipping
                  information.
                </p>
                <p>
                  You represent and warrant that: (i) you have the legal right
                  to use any credit card(s) or other payment methods (s) in
                  connection with any Purchase; and that (ii) the information
                  you supply to us is true, correct, and complete.
                </p>
                <p>
                  We may employ the use of third-party services for the purpose
                  of facilitating payment and the completion of Purchases. By
                  submitting your information, you grant us the right to provide
                  the information to these third parties subject to our Privacy
                  Policy.
                </p>
                <p>
                  We reserve the right to refuse or cancel your order at any
                  time for reasons including but not limited to product or
                  service availability, errors in the description or price of
                  the product or service, error in your order, or other reasons.
                </p>
                <p>
                  We reserve the right to refuse or cancel your order if fraud
                  or an unauthorized or illegal transaction is suspected.
                </p>
              </div>
            </section>

            {/* 4. Contests, Sweepstakes, and Promotions */}
            <section id="contests" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                4. Contests, Sweepstakes, and Promotions
              </h2>
              <p>
                Any contests, sweepstakes or other promotions (collectively,
                “Promotions”) made available through Service and the Product may
                be governed by rules that are separate from these Terms of
                Service. If you participate in any Promotions, please review the
                applicable rules as well as our Privacy Policy. If the rules for
                a Promotion conflict with these Terms of Service, Promotion
                rules will apply.
              </p>
            </section>

            {/* 5. Subscriptions */}
            <section id="subscriptions" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                5. Subscriptions
              </h2>
              <div className="space-y-4">
                <p>
                  Some parts of the Service and the Product are billed on a
                  subscription basis (“Subscription(s)”). You will be billed in
                  advance on a recurring and periodic basis (“Billing Cycle”).
                  Billing cycles are set on a monthly basis of 28 days or the
                  entire year consisting of 365 days.
                </p>
                <p>
                  At the end of each Billing Cycle, your Subscription will
                  automatically renew under the exact same conditions unless you
                  cancel it or Zemuria Inc. cancels it. You may cancel your
                  Subscription renewal either through your online account
                  management page or by contacting the customer support team by
                  emailing us at support@zemuria.com
                </p>
                <p>
                  A valid payment method, including a credit card, is required
                  to process the payment for your subscription. You shall
                  provide Zemuria Inc. with accurate and complete billing
                  information including full name, address, state, zip code,
                  telephone number, and valid payment method information. By
                  submitting such payment information, you automatically
                  authorize Zemuria Inc. to charge all Subscription fees
                  incurred through your account to any such payment instruments.
                </p>
                <p>
                  Should automatic billing fail to occur for any reason, Zemuria
                  Inc. might issue an electronic invoice indicating that you
                  must proceed manually, within a certain deadline date, with
                  the full payment corresponding to the billing period as
                  indicated on the invoice which if that also is not paid by the
                  deadline, will automatically result in the denial and
                  cancellation of the service and product.
                </p>
              </div>
            </section>

            {/* 6. Free Trial */}
            <section id="freetrial" className="scroll-mt-28">
              <h2 className="text-base font-normal leading-6 tracking-normal text-[#14142D] mb-4">
                6. Free Trial
              </h2>
              <p>Ze</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
