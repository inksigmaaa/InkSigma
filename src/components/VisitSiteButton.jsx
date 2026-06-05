"use client";

import { NightTooltip } from "@/components/ui/tooltip";
import { usePublication } from "@/contexts/PublicationContext";
import { getPublicationSiteHref } from "@/utils/publicationDomain";

export default function VisitSiteButton() {
  const { currentPublication } = usePublication();
  const publicationSiteHref = getPublicationSiteHref(currentPublication);

  return (
    <NightTooltip content="Visit site">
      <a
        href={publicationSiteHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          width: '82px',
          height: '32px',
          borderRadius: '4px',
          padding: '8px 16px',
          gap: '10px',
          background: 'linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)',
          boxShadow: '0px 4px 8px 0px #EADBF9',
          fontFamily: 'Public Sans',
          fontWeight: 600,
          fontSize: '12px',
          lineHeight: '150%',
          letterSpacing: '0%',
          color: '#EDEDED',
          opacity: 1,
          textDecoration: 'none',
          whiteSpace: 'nowrap'
        }}
        className="fixed bottom-20 right-4 z-[100] flex items-center justify-center hover:opacity-90 transition-opacity md:hidden"
        aria-label="Visit site"
      >
        View Site
      </a>
    </NightTooltip>
  )
}
