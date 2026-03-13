import { NightTooltip } from "@/components/ui/tooltip";

export default function VisitSiteButton() {
  return (
    <NightTooltip content="Visit site">
      <a 
        href="/" 
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          whiteSpace: 'nowrap'
        }}
        className="hover:opacity-90 transition-opacity"
        aria-label="Visit site"
      >
        View Site
      </a>
    </NightTooltip>
  )
}
