import React, { useState } from 'react';
import './InfoTooltip.css';

const InfoTooltip = ({ text, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span 
      className="info-tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="info-icon">
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
      {isVisible && (
        <span className={`info-tooltip-box tooltip-${position}`}>
          {text}
          <span className="tooltip-arrow" />
        </span>
      )}
    </span>
  );
};

export default InfoTooltip;
