import { useRef, useEffect } from 'react';

/**
 * UIPanel - Reusable panel container with dark medical theme
 */
export default function UIPanel({ title, children, style = {} }) {
    return (
        <div className="ui-panel" style={style}>
            <div className="ui-panel-header">
                <span className="ui-panel-title">{title.toUpperCase()}</span>
            </div>
            <div className="ui-panel-divider"></div>
            <div className="ui-panel-content">
                {children}
            </div>
        </div>
    );
}
