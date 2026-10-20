export function LoadingState() { return <div className="state-panel">Loading...</div>; }
export function ErrorState({ message = 'Unable to load data. Please try again.', onRetry }) { return <div className="state-panel error-state"><p>{message}</p>{onRetry && <button className="button button-outline" onClick={onRetry}>Try again</button>}</div>; }
export function EmptyState({ children = 'Nothing here just yet.' }) { return <div className="state-panel">{children}</div>; }
