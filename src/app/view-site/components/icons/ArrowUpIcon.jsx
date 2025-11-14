export default function ArrowUpIcon({ className = "", width = 24, height = 24 }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      className={className}
    >
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
  );
}
