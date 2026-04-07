"use client";

import React, { useEffect, useState } from "react";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("collection");
  const [showTOC, setShowTOC] = useState(false);

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
      setShowTOC(false); // Close TOC after clicking
    }
  };

  const TableOfContents = () => (
    <nav className="space-y-1 pl-12" style={{ width: '271px' }}>
      <ul className="space-y-2 text-sm list-disc pl-4">
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
            Collection of Information
          </a>
        </li>
        <li>
          <a
            href="#use"
            onClick={(e) => scrollToSection(e, "use")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "use"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Use of Information
          </a>
        </li>
        <li>
          <a
            href="#sharing"
            onClick={(e) => scrollToSection(e, "sharing")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "sharing"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Sharing of Information
          </a>
        </li>
        <li>
          <a
            href="#embeds"
            onClick={(e) => scrollToSection(e, "embeds")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "embeds"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Third-Party Embeds
          </a>
        </li>
        <li>
          <a
            href="#transfers"
            onClick={(e) => scrollToSection(e, "transfers")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "transfers"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            International Data Transfers
          </a>
        </li>
        <li>
          <a
            href="#choices"
            onClick={(e) => scrollToSection(e, "choices")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "choices"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Your Choices
          </a>
        </li>
        <li>
          <a
            href="#contact"
            onClick={(e) => scrollToSection(e, "contact")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "contact"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Contact Us
          </a>
        </li>
      </ul>
    </nav>
  );

  return (
    <div className="w-full md:max-w-[80%] mx-auto px-6 md:px-8 pt-[98px] md:pt-[140px] pb-12 md:pb-20 lg:pb-24">
      {/* Mobile Floating TOC Button */}
      <button
        onClick={() => setShowTOC(!showTOC)}
        className={`md:hidden fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 bg-[#FEFEFE] rounded-[40px] shadow-lg flex items-center justify-center transition-all duration-300 ${
          showTOC ? 'border-t border-gray-200' : ''
        }`}
        style={
          showTOC
            ? { width: '360px', height: '66px', paddingTop: '24px', paddingRight: '32px', paddingBottom: '24px', paddingLeft: '32px', gap: '12px' }
            : { width: '160px', height: '42px', paddingTop: '12px', paddingRight: '24px', paddingBottom: '12px', paddingLeft: '24px', gap: '8px' }
        }
      >
        <img 
          src="/images/icons/down.svg" 
          alt="toggle" 
          className={`transition-transform duration-300 ${showTOC ? '' : 'rotate-180'}`}
          style={{ width: '10px', height: '5px' }}
        />
        <span className="text-[12px] leading-[150%] text-[#080808] font-normal">
          Table of Content
        </span>
      </button>

      {/* Mobile TOC Overlay */}
      {showTOC && (
        <div 
          className="md:hidden fixed inset-0 z-20 flex items-end"
          onClick={() => setShowTOC(false)}
        >
          <div 
            className="bg-white rounded-t-[32px] w-full shadow-2xl"
            style={{ 
              marginBottom: '80px', 
              maxHeight: '75vh', 
              overflowY: 'auto',
              animation: 'slideUpSpring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-8">
              <nav>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#collection"
                      onClick={(e) => scrollToSection(e, "collection")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Collection of Information
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#use"
                      onClick={(e) => scrollToSection(e, "use")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Use of Information
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#sharing"
                      onClick={(e) => scrollToSection(e, "sharing")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Sharing of Information
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#embeds"
                      onClick={(e) => scrollToSection(e, "embeds")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Third-Party Embeds
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#transfers"
                      onClick={(e) => scrollToSection(e, "transfers")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      International Data Transfers
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#choices"
                      onClick={(e) => scrollToSection(e, "choices")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Your Choices
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#contact"
                      onClick={(e) => scrollToSection(e, "contact")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Contact Us
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUpSpring {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
        {/* Sidebar / Table of Contents - Hidden on small mobile, visible on desktop */}
        <aside className="hidden md:block flex-shrink-0">
          <div className="sticky top-28">
            <TableOfContents />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1" style={{ maxWidth: '707px' }}>
          <p className="text-[14px] md:text-[32px] font-bold leading-[13px] md:leading-6 tracking-normal text-[#000000] mb-8">
            Privacy Policy
          </p>

          <div className="space-y-8 text-gray-700 font-sans text-[8px] md:text-base leading-[13px] md:leading-normal">
            <div className="space-y-4">
              <p>
                This Privacy Policy outlines how Inksigma ("we," "us," or "our") collects, uses, and discloses information about you. This Privacy Policy is applicable when you use our websites, mobile applications, and other online products and services that link to this Privacy Policy (collectively referred to as "Services"), communicate with our customer support, interact with us on social media, or engage with us in any other way.
              </p>
              <p>
                We may update this Privacy Policy periodically. Changes will be indicated by revising the date at the top of this policy, and we may provide additional notice if necessary. We encourage you to regularly review this Privacy Policy to stay informed about our data practices and your choices.
              </p>
            </div>

            {/* Collection of Information */}
            <section id="collection" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                Collection of Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg md:text-lg text-[8px] font-medium leading-[13px] md:leading-normal text-[#14142D] mb-2">
                    1. Information You Provide to Us
                  </h3>
                  <p>
                    We collect the information you directly provide to us. For instance, when you create an account, submit forms, post content through our Services, contact customer support, or engage with us on third-party platforms. The personal information we may collect includes your name, username, email address, profile details, business information, content you submit, and any other information you provide.
                  </p>
                  <p className="mt-2">
                    Occasionally, we may collect information about others from you, such as when you purchase a subscription for someone else. We'll only use this information to fulfill your request, and we won't send unrelated communications to your contacts without their consent.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg md:text-lg text-[8px] font-medium leading-[13px] md:leading-normal text-[#14142D] mb-2">
                    2. Information We Collect Automatically
                  </h3>
                  <p className="mb-2">In certain instances, we automatically gather specific information, including:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Activity Information:</strong> Details about your actions on our Services, such as the posts you read, links you share, and content you interact with.
                    </li>
                    <li>
                      <strong>Transactional Information:</strong> Information related to transactions, such as subscription details and purchase history.
                    </li>
                    <li>
                      <strong>Device and Usage Information:</strong> Data about how you access our Services, including device details, IP address, browser type, and access times.
                    </li>
                    <li>
                      <strong>Cookies and Tracking Technologies:</strong> We employ cookies and similar technologies to collect data for enhancing our Services, understanding user behavior, and delivering targeted content. For more details about cookies and how to manage them, please refer to the Your Choices section.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg md:text-lg text-[8px] font-medium leading-[13px] md:leading-normal text-[#14142D] mb-2">
                    3. Information We Collect from Other Sources
                  </h3>
                  <p>
                    We may obtain information from third-party sources, including social networks and data analytics providers. If you log into your Inksigma account using third-party platforms, we may access certain information from those platforms based on their authorization procedures.
                  </p>
                </div>
              </div>
            </section>

            {/* Use of Information */}
            <section id="use" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                Use of Information
              </h2>
              <p>
                We use collected information to provide, maintain, and improve our Services. This includes personalizing content, processing transactions, sending notifications, analyzing usage trends, preventing fraudulent activities, complying with legal obligations, and communicating with you about our products and services.
              </p>
            </section>

            {/* Sharing of Information */}
            <section id="sharing" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                Sharing of Information
              </h2>
              <p className="mb-3">
                We share personal information under certain circumstances, including with other Services users, service providers, legal authorities, and business partners. For instance:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Other Users:</strong> Information you share publicly or through interactions with our Services will be visible to other users.
                </li>
                <li>
                  <strong>Service Providers:</strong> We engage service providers to assist with hosting, analytics, payments, customer service, marketing, and more.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> We may disclose information in response to lawful requests or to protect our rights, safety, and property.
                </li>
                <li>
                  <strong>Business Transactions:</strong> Information might be shared during mergers, acquisitions, or other business activities.
                </li>
                <li>
                  <strong>Consent and Aggregation:</strong> We share information with your consent or in aggregated and de-identified forms.
                </li>
              </ul>
            </section>

            {/* Third-Party Embeds */}
            <section id="embeds" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                Third-Party Embeds
              </h2>
              <p>
                Some content displayed on our Services might be hosted by third parties through embedded content. Interacting with such content may result in data collection by the hosting third party. We recommend reviewing the privacy policy of the hosting third party before interacting with embedded content.
              </p>
            </section>

            {/* International Data Transfers */}
            <section id="transfers" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                International Data Transfers
              </h2>
              <p>
                Inksigma operates from various locations, including the United States and other countries. Consequently, we may transfer your personal information to jurisdictions with varying data protection laws. We take steps to ensure your data receives adequate protection in these jurisdictions.
              </p>
            </section>

            {/* Your Choices */}
            <section id="choices" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                Your Choices
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Account Information:</strong> You can access, correct, delete, and export your account information through your account settings.
                </li>
                <li>
                  <strong>Cookies:</strong> Most browsers allow you to manage cookies by adjusting settings. However, note that this might impact the functionality of our Services.
                </li>
                <li>
                  <strong>Communications:</strong> You can opt out of certain communications through your account settings or by following instructions in the communications.
                </li>
                <li>
                  <strong>Mobile Push Notifications:</strong> You can control push notifications on your mobile device.
                </li>
              </ul>
            </section>

            {/* Contact Us */}
            <section id="contact" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at <a href="mailto:inksigma@zemuria.com" className="text-gray-700 hover:underline">inksigma@zemuria.com</a>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
