'use client';

import { useEffect, useState, useCallback } from 'react';

// Constants for layout and scroll behavior
const HEADER_OFFSET = 0; // Matches fixed header height
const SCROLL_OFFSET = 180; // Offset for active section detection (must be > HEADER_OFFSET + padding)
const STICKY_TOP_OFFSET = 100; // Sticky position from top

export default function TableOfContents({ content }) {
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState('');

  // Extract headings from the article
  useEffect(() => {
    // Small timeout to ensure DOM is updated after content renders
    const timer = setTimeout(() => {
      const article = document.querySelector('article');
      if (article) {
        const headings = article.querySelectorAll('h2');
        const extractedSections = Array.from(headings).map((heading, index) => {
          // Create a consistent ID based on content or fallback to index
          const id = heading.id || `section-${index + 1}`;
          if (!heading.id) {
            heading.id = id;
          }
          
          return {
            id,
            title: heading.textContent,
          };
        });
        setSections(extractedSections);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  // Handle scroll to highlight active section
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + SCROLL_OFFSET;

          // Find the current section based on scroll position
          // We iterate backwards to find the last section that we've scrolled past
          let currentSection = '';
          for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i].id);
            if (section && section.offsetTop <= scrollPosition) {
              currentSection = sections[i].id;
              break;
            }
          }
          
          if (currentSection !== activeSection) {
            setActiveSection(currentSection);
          }
          
          ticking = false;
        });

        ticking = true;
      }
    };

    if (sections.length > 0) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial check

      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [sections, activeSection]);

  const scrollToSection = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = HEADER_OFFSET + 40; // Header + extra breathing room
      const elementPosition = element.offsetTop - offset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
      
      // Manually set active section immediately for better UX
      setActiveSection(id);
    }
  }, []);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className={`w-full sticky top-[${STICKY_TOP_OFFSET}px] h-fit max-h-[80vh] overflow-y-auto pr-4`}>
       {/* Added max-h and overflow for long TOCs */}
      <div>
        <h3 className="text-[#14142D] text-xl font-bold leading-[19.2px] tracking-normal mb-6">
          Table of Contents
        </h3>
        <nav>
          <ul className="space-y-4 relative pl-0 ml-0">
            {sections.map((section) => (
              <li key={section.id} className="relative pl-4">
                 {/* Active Indicator Line */}
                {activeSection === section.id && (
                  <div className="absolute left-[-1px] top-0 h-full w-[2px] bg-[#202020] transition-all duration-300" />
                )}
                
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`text-left text-sm transition-all duration-200 font-normal leading-5 tracking-normal hover:text-[#202020] block w-full outline-none focus:outline-none ${
                    activeSection === section.id
                      ? 'text-[#202020] font-bold'
                      : 'text-[#696969] hover:translate-x-1'
                  }`}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
