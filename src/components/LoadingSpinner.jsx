function LoadingSpinner() {
  return <div className="loading-state" role="status">
    <span className="spinner" aria-hidden="true" />
    <p>Loading movies…</p>
  </div>;
}
export default LoadingSpinner;
