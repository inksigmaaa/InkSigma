export default function CameraIcon({ className = "", width = 20, height = 20 }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#000000" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="#000000" strokeWidth="2"/>
      <path d="M9 3h6" stroke="#000000" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
