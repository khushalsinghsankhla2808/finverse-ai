import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showWordmark = true }) => {
  const logoId = React.useId();
  const lightGradId = `wordmark-grad-light-${logoId.replace(/:/g, '')}`;
  const darkGradId = `wordmark-grad-dark-${logoId.replace(/:/g, '')}`;

  const wordmarkPath =
    "M80 14h24v8H88v6h14v8H88v14H80ZM108 14h6v6h-6ZM108 26h6v24h-6ZM118 26h6v4h.2c1.2-2.8 3.8-4.2 7.8-4.2 5 0 8 3 8 8v16h-6V35c0-3-1.5-4.5-4.5-4.5-3 0-4.5 1.5-4.5 4.5v15h-6ZM142 14h6.5l5.5 25 5.5-25H166l-9 36h-6ZM180 25.8c-5.5 0-9.8 4.2-9.8 10.2 0 6 4.3 10.2 10.2 10.2 3.8 0 6.8-1.5 8.6-4.2l-4.5-2.6c-1 1.4-2.4 2.2-4.1 2.2-2.5 0-4.2-1.6-4.5-4.2h13.8c.1-.5.1-1.1.1-1.6 0-5.8-3.8-10-9.8-10zm-4.1 8c.3-2.4 1.9-3.8 4.1-3.8 2.2 0 3.7 1.4 4 3.8h-8.1zM194 26h6v4.2c1.2-2.8 3.5-4.2 6.8-4.2h1.2v6.2h-1.8c-3.6 0-5.4 1.8-5.4 5.4V50h-6ZM220 25.8c-4.8 0-7.8 2.5-7.8 6.2 0 3.6 2.4 5.2 6.2 6.2 2.8.8 3.8 1.4 3.8 2.6 0 1.2-1.2 2-3 2-2 0-3.6-.8-4.6-2.2l-4.2 3.2c1.8 2.8 4.8 4.4 8.8 4.4 5.2 0 8.4-2.6 8.4-6.4 0-3.8-2.4-5.4-6.4-6.4-2.6-.7-3.6-1.3-3.6-2.4 0-1.1 1.1-1.8 2.6-1.8 1.8 0 3.1.7 4 2l4.2-3c-1.6-2.6-4.3-4.2-8.4-4.2zM242 25.8c-5.5 0-9.8 4.2-9.8 10.2 0 6 4.3 10.2 10.2 10.2 3.8 0 6.8-1.5 8.6-4.2l-4.5-2.6c-1 1.4-2.4 2.2-4.1 2.2-2.5 0-4.2-1.6-4.5-4.2h13.8c.1-.5.1-1.1.1-1.6 0-5.8-3.8-10-9.8-10zm-4.1 8c.3-2.4 1.9-3.8 4.1-3.8 2.2 0 3.7 1.4 4 3.8h-8.1z";

  return (
    <Link
      to="/"
      aria-label="FinVerse home"
      className={`group inline-flex items-center gap-3 outline-hidden focus-visible:ring-2 focus-visible:ring-[#FF9A6B] focus-visible:ring-offset-2 rounded-md transition-all ${className}`}
    >
      <svg
        viewBox={showWordmark ? "0 0 256 64" : "0 0 64 64"}
        className={showWordmark ? "h-9 w-auto overflow-visible select-none" : "h-9 w-9 overflow-visible select-none"}
        aria-hidden="true"
      >
        <defs>
          {/* Light Mode Hover Gradient: #1F4E79 to #E8730C */}
          <linearGradient id={lightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1F4E79" />
            <stop offset="100%" stopColor="#E8730C" />
          </linearGradient>

          {/* Dark Mode Hover Gradient: #6FA8DC to #E8730C */}
          <linearGradient id={darkGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6FA8DC" />
            <stop offset="100%" stopColor="#E8730C" />
          </linearGradient>
        </defs>

        {/* LOGO MARK: 64x64, rx=6 */}
        <rect
          width="64"
          height="64"
          rx="6"
          fill="#111111"
          className="dark:fill-[#F6F7F5]"
        />
        <path
          d="M17 14H49V24H27V28H41V38H27V50H17Z"
          fill="#FFFFFF"
          className="dark:fill-[#111111]"
        />

        {showWordmark && (
          <g>
            {/* Base Wordmark (Default state: #111111 in light, #F6F7F5 in dark) */}
            <path
              d={wordmarkPath}
              fill="#111111"
              className="dark:fill-[#F6F7F5]"
            />

            {/* Hover Gradient Overlay (Light Mode) */}
            <path
              d={wordmarkPath}
              fill={`url(#${lightGradId})`}
              className="dark:hidden opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 ease-out motion-reduce:transition-none"
            />

            {/* Hover Gradient Overlay (Dark Mode) */}
            <path
              d={wordmarkPath}
              fill={`url(#${darkGradId})`}
              className="hidden dark:block opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 ease-out motion-reduce:transition-none"
            />
          </g>
        )}
      </svg>
    </Link>
  );
};

export default Logo;
