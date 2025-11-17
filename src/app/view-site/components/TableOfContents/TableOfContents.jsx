'use client';

import { useEffect, useState } from 'react';

export default function TableOfContents() {
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    // Extract all h2 headings from the article content
    const article = document.querySelector('article');
    if (article) {
      const headings = article.querySelectorAll('h2');
      const extractedSections = Array.from(headings).map((heading, index) => {
        // Create an ID if it doesn't exist
        if (!heading.id) {
          heading.id = `section-${index + 1}`;
        }
        return {
          id: heading.id,
          title: heading.textContent,
        };
      });
      setSections(extractedSections);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      // Find the current section based on scroll position
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    if (sections.length > 0) {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Call once to set initial state

      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [sections]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="w-100 sticky h-fit">
      {/* Table of Contents - Only show if there are sections */}
      {sections.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-black mb-4">Table of Contents</h3>
          <nav>
            <ul className="space-y-3">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`text-left text-sm transition-colors hover:text-black ${
                      activeSection === section.id
                        ? 'text-black font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
