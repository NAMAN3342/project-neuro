import React from 'react';
import './ChannelSelector.css';

const ChannelSelector = ({ selected, setSelected, channelData }) => {
  return (
    <div className="channel-selector">
      {[1, 2, 3].map(num => {
        const isActive = selected === num;
        const data = channelData[`ch${num}`];
        const hasSignal = data && data.raw && data.raw.length > 0;
        
        return (
          <button
            key={num}
            className={`channel-btn ${isActive ? 'active' : ''}`}
            onClick={() => setSelected(num)}
          >
            <div className="channel-header">
              <span className="channel-num">CH{num}</span>
              <span className={`signal-dot ${hasSignal ? 'active' : ''}`} />
            </div>
            <div className="channel-label">
              {num === 1 ? 'Occipital' : num === 2 ? 'Parietal' : 'Frontal'}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChannelSelector;
