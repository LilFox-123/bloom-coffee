export default function Logo({ size = 40, variant = 'default' }) {
  if (variant === 'white') {
    // For use on the espresso sidebar / login panel
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="23" fill="rgba(200,146,42,0.18)" />
        <path d="M16 22h13v6a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5v-6z" fill="#FFFFFF" />
        <path d="M29 23h2.5a2.5 2.5 0 0 1 0 5H29" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <path d="M22 21c0-4 3.5-7 8-7 0 4-3.5 7-8 7z" fill="#C8922A" />
        <path d="M22 21c2-1.7 4-3.3 6.5-5" stroke="#FEF3DC" strokeWidth="1" strokeLinecap="round" />
        <path d="M19 16c1-1 1-2 0-3M23 15c1-1 1-2 0-3" stroke="#FEF3DC" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#2C1A0E" />
      <circle cx="24" cy="24" r="23" stroke="#C8922A" strokeOpacity="0.5" strokeWidth="1" />
      <path d="M16 22h13v6a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5v-6z" fill="#FDF8F3" />
      <path d="M29 23h2.5a2.5 2.5 0 0 1 0 5H29" stroke="#FDF8F3" strokeWidth="2" fill="none" />
      <path d="M22 21c0-4 3.5-7 8-7 0 4-3.5 7-8 7z" fill="#C8922A" />
      <path d="M22 21c2-1.7 4-3.3 6.5-5" stroke="#FEF3DC" strokeWidth="1" strokeLinecap="round" />
      <path d="M19 16c1-1 1-2 0-3M23 15c1-1 1-2 0-3" stroke="#C8922A" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}
