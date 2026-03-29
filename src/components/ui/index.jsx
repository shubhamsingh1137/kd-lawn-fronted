// src/components/ui/index.jsx

// ── Loading Spinner ───────────────────────────────────────────────────────────
export const Spinner = ({ size = "md", center = false }) => {
  const sizes = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={center ? "flex justify-center py-12" : "inline-block"}>
      <div className={`${sizes[size]} border-2 border-gray-200 border-t-gold rounded-full animate-spin`} />
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  rejected:  "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  active:    "bg-green-100 text-green-700 border-green-200",
  inactive:  "bg-gray-100 text-gray-500 border-gray-200",
  blocked:   "bg-red-100 text-red-700 border-red-200",
};

export const Badge = ({ status, label }) => (
  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize
    ${BADGE_COLORS[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
  >
    {label || status}
  </span>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger = false }) => (
  <Modal open={open} onClose={onClose} title={title || "Are you sure?"} maxWidth="max-w-sm">
    <p className="text-sm text-gray-600 mb-6">{message}</p>
    <div className="flex gap-3">
      <button
        onClick={() => { onConfirm(); onClose(); }}
        className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors
          ${danger ? "bg-red-500 hover:bg-red-600" : "bg-gold hover:bg-gold-dark"}`}
      >
        {confirmLabel}
      </button>
      <button
        onClick={onClose}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        Cancel
      </button>
    </div>
  </Modal>
);

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = "📭", message = "No data found", action }) => (
  <div className="text-center py-16">
    <div className="text-5xl mb-4">{icon}</div>
    <p className="text-gray-400 mb-4">{message}</p>
    {action}
  </div>
);

// ── Page Header ───────────────────────────────────────────────────────────────
export const AdminPageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-8">
    <div>
      <h1 className="text-2xl font-serif font-bold text-gray-800">{title}</h1>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, color = "bg-gold", sub }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
    <div className={`${color} text-white p-3 rounded-xl text-xl shrink-0`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gold font-medium mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Table wrapper ─────────────────────────────────────────────────────────────
export const Table = ({ headers, children, empty }) => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">{children}</tbody>
      </table>
    </div>
    {empty}
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────────
export const Pagination = ({ page, total, limit = 10, onChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
      <span>
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-gray-50"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => (
            <>
              {idx > 0 && arr[idx - 1] !== p - 1 && (
                <span key={`dots-${p}`} className="px-2 py-1.5">…</span>
              )}
              <button
                key={p}
                onClick={() => onChange(p)}
                className={`px-3 py-1.5 rounded-lg border transition-colors
                  ${p === page ? "bg-gold text-white border-gold" : "hover:bg-gray-50"}`}
              >
                {p}
              </button>
            </>
          ))
        }
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
