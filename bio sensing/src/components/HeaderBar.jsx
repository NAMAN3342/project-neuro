/**
 * HeaderBar - Professional top navigation with live status
 */
export default function HeaderBar({ isConnected, isTestingMode }) {
    const isLive = isConnected || isTestingMode;

    return (
        <div className="header-bar">
            <div className="header-title">
                NEURO-THERMAL FUSION <span className="header-separator">//</span> LIVE MONITOR
            </div>

            <div className="header-status">
                {isLive && (
                    <>
                        <div className="status-pulse"></div>
                        <span className="status-text">LIVE DATA</span>
                    </>
                )}
            </div>
        </div>
    );
}
