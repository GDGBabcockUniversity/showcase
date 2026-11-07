export default function Loading() {
  return (
    <div className="shear-loader" role="status" aria-label="Loading">
      <svg viewBox="0 0 100 100" width="96" height="96" aria-hidden="true">
        <g transform="skewY(-24) translate(0 29)">
          <rect x="8" y="14" width="18" height="60" rx="9" fill="#4285F4" />
          <rect x="31" y="14" width="18" height="60" rx="9" fill="#EA4335" />
          <rect x="54" y="14" width="18" height="60" rx="9" fill="#FBBC04" />
          <rect x="77" y="14" width="18" height="60" rx="9" fill="#34A853" />
        </g>
      </svg>
    </div>
  );
}
