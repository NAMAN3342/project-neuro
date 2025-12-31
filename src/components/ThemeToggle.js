import React from 'react';
import './ThemeToggle.css';

const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <span className={`theme-icon ${theme === 'dark' ? 'active' : ''}`}>
        🌙
      </span>
      <span className={`theme-icon ${theme === 'light' ? 'active' : ''}`}>
        ☀️
      </span>
      <span 
        className="theme-slider" 
        style={{ transform: theme === 'light' ? 'translateX(24px)' : 'translateX(0)' }}
      />
    </button>
  );
};

export default ThemeToggle;
 