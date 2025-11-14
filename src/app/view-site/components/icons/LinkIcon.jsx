export default function LinkIcon({ className = "", width = 20, height = 20 }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M27.088 20.912a8.736 8.736 0 00-12.352 0l-6.178 6.176a8.734 8.734 0 1012.354 12.354L24 36.354" 
        stroke="#000000" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      <path 
        d="M20.912 27.088a8.736 8.736 0 0012.352 0l6.178-6.176a8.734 8.734 0 10-12.354-12.354L24 11.646" 
        stroke="#000000" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
    </svg>
  );
}
