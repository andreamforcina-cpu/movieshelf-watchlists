function ErrorMessage({ message, onRetry }) {
  return <div className="error-state" role="alert">
    <p>{message}</p>
    {onRetry && <button type="button" className="search-button" onClick={onRetry}>Try again</button>}
  </div>;
}
export default ErrorMessage;
