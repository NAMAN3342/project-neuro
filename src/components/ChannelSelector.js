import React from 'react';
import InfoTooltip from './InfoTooltip';
import './ChannelSelector.css';

const channelInfo = {
  1: { name: 'Occipital', tooltip: 'O1/O2 region - Visual processing area at the back of the head. Best for detecting Alpha waves when eyes are closed.' },
  2: { name: 'Parietal', tooltip: 'Pz region - Central-top area processing sensory integration and spatial awareness. Good for attention monitoring.' },
  3: { name: 'Frontal', tooltip: 'Fp1/Fp2 region - Front forehead area handling executive functions, focus, and decision making. Shows Beta during concentration.' }
};

const ChannelSelector = ({ selected, setSelected, channelData }) => {
  return (
    <div className="channel-selector">
      {[1, 2, 3].map(num => {
        const isActive = selected === num;
        const data = channelData[`ch${num}`];
        const hasSignal = data && data.raw && data.raw.length > 0;
        const info = channelInfo[num];
        
        return (
          <button
            key={num}
            className={`channel-btn ${isActive ? 'active' : ''}`}
            onClick={() => setSelected(num)}
          >
            <div className="channel-header">
              <span className="channel-num">CH{num}</span>
              <InfoTooltip text={info.tooltip} />
              <span className={`signal-dot ${hasSignal ? 'active' : ''}`} />
            </div>
            <div className="channel-label">
              {info.name}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChannelSelector;
