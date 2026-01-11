import React from 'react';
import InfoTooltip from './InfoTooltip';
import './ChannelSelector.css';

const channelInfo = {
  1: { name: 'Fp1-Fp2', tooltip: 'Frontal (Fp1-Fp2) - Prefrontal cortex. Executive functions, attention, focus, and decision making. Shows Beta during concentration.' },
  2: { name: 'C3-C4', tooltip: 'Motor (C3-C4) - Motor cortex. Left/Right hemisphere motor activity. Best for motor imagery and movement intention.' },
  3: { name: 'O1-O2', tooltip: 'Occipital (O1-O2) - Visual cortex at the back of the head. Best for detecting Alpha waves when eyes are closed.' }
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
