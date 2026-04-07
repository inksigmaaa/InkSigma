"use client";

import React, { useEffect, useState } from "react";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("conduct");
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
            href="#conduct"
            onClick={(e) => scrollToSection(e, "conduct")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "conduct"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            User Conduct
          </a>
        </li>
        <li>
          <a
            href="#content"
            onClick={(e) => scrollToSection(e, "content")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "content"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            User Content
          </a>
        </li>
        <li>
          <a
            href="#intellectual"
            onClick={(e) => scrollToSection(e, "intellectual")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "intellectual"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Intellectual Property
          </a>
        </li>
        <li>
          <a
            href="#termination"
            onClick={(e) => scrollToSection(e, "termination")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "termination"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Termination
          </a>
        </li>
        <li>
          <a
            href="#liability"
            onClick={(e) => scrollToSection(e, "liability")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "liability"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Limitation of Liability
          </a>
        </li>
        <li>
          <a
            href="#governing"
            onClick={(e) => scrollToSection(e, "governing")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "governing"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Governing Law
          </a>
        </li>
        <li>
          <a
            href="#changes"
            onClick={(e) => scrollToSection(e, "changes")}
            className={`block py-1 hover:text-black transition-colors ${
              activeSection === "changes"
                ? "text-black font-semibold"
                : "text-gray-500"
            }`}
          >
            Changes
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
                      href="#conduct"
                      onClick={(e) => scrollToSection(e, "conduct")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      User Conduct
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#content"
                      onClick={(e) => scrollToSection(e, "content")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      User Content
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#intellectual"
                      onClick={(e) => scrollToSection(e, "intellectual")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Intellectual Property
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#termination"
                      onClick={(e) => scrollToSection(e, "termination")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Termination
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#liability"
                      onClick={(e) => scrollToSection(e, "liability")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Limitation of Liability
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#governing"
                      onClick={(e) => scrollToSection(e, "governing")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Governing Law
                    </a>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#9E9E9E] text-sm">•</span>
                    <a
                      href="#changes"
                      onClick={(e) => scrollToSection(e, "changes")}
                      className="block text-[10px] leading-[18px] text-[#6B6B6B] hover:text-black font-normal"
                    >
                      Changes
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
            Terms and Conditions
          </p>

          <div className="space-y-8 text-gray-700 font-sans text-[8px] md:text-base leading-[13px] md:leading-normal">
            <div className="space-y-4">
              <p>
                Please read these Terms of Use ("Terms") carefully before using the Inksigma website, mobile applications, and other online products and services (collectively referred to as the "Service") operated by Zemuria Inc. ("we," "us," "our," or "Zemuria").
              </p>
              <p>
                By accessing or using the Service, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not use the Service.
              </p>
            </div>

            {/* 1. User Conduct */}
            <section id="conduct" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                1. User Conduct
              </h2>
              <p className="mb-3">By using the Service, you agree to:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Comply with all applicable laws and regulations.</li>
                <li>Respect the intellectual property rights of Inksigma and other third parties.</li>
                <li>Refrain from engaging in prohibited activities, including but not limited to:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Posting or transmitting any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</li>
                    <li>Impersonating any person or entity, or falsely stating or otherwise misrepresenting your affiliation with a person or entity.</li>
                    <li>Interfering with or disrupting the Service or servers and networks connected to the Service.</li>
                    <li>Violating any requirements, procedures, policies, or regulations of networks connected to the Service.</li>
                    <li>Collecting or storing personal data about other users without their consent.</li>
                    <li>Engaging in any activity that could compromise the security of the Service or its users.</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 2. User Content */}
            <section id="content" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                2. User Content
              </h2>
              <p>
                You retain ownership of any content you submit, post, or display on or through the Service ("User Content"). By posting User Content, you grant Inksigma a non-exclusive, worldwide, royalty-free, and sublicensable license to use, reproduce, modify, adapt, publish, translate, distribute, publicly perform, and publicly display your User Content in connection with the Service.
              </p>
            </section>

            {/* 3. Intellectual Property */}
            <section id="intellectual" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                3. Intellectual Property
              </h2>
              <p>
                The Service and its original content (excluding User Content), features, and functionality are owned by Zemuria Inc. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>
            </section>

            {/* 4. Termination */}
            <section id="termination" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                4. Termination
              </h2>
              <p>
                We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
              </p>
            </section>

            {/* 5. Limitation of Liability */}
            <section id="liability" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                5. Limitation of Liability
              </h2>
              <p className="mb-3">
                To the extent permitted by applicable law, Inksigma shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Your access to or use of or inability to access or use the Service.</li>
                <li>Any conduct or content of any third party on the Service.</li>
                <li>Any unauthorized access, use, or alteration of your transmissions or content.</li>
                <li>Any content obtained from the Service.</li>
                <li>Unauthorized access to or use of our servers and/or any personal information stored therein.</li>
              </ol>
            </section>

            {/* 6. Governing Law */}
            <section id="governing" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                6. Governing Law
              </h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of The State of Delaware, without regard to its conflict of law provisions.
              </p>
            </section>

            {/* 7. Changes */}
            <section id="changes" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                7. Changes
              </h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide notice before any new terms take effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            {/* 8. Contact Us */}
            <section id="contact" className="scroll-mt-28">
              <h2 className="text-xl md:text-xl text-[8px] font-semibold leading-[13px] md:leading-normal text-[#14142D] mb-4">
                8. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms, please contact us at <a href="mailto:inksigma@zemuria.com" className="text-gray-700 hover:underline">inksigma@zemuria.com</a>.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
