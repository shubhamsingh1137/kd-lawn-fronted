import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../../services/api";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  completed: "bg-blue-100 text-blue-700",
};

export default function ManageBookings() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery(
    ["adminBookings", statusFilter],
    () => api.get(`/bookings/admin/all${statusFilter ? `?status=${statusFilter}` : ""}`).then(r => r.data)
  );

  const updateStatus = useMutation(
    ({ id, status, adminNote }) => api.patch(`/bookings/admin/${id}/status`, { status, adminNote }),
    {
      onSuccess: () => {
        toast.success("Booking updated");
        qc.invalidateQueries("adminBookings");
        qc.invalidateQueries("bookingStats");
        setSelected(null);
        setNote("");
      },
      onError: (err) => toast.error(err.response?.data?.message || "Update failed"),
    }
  );

  const handleAction = (status) => {
    updateStatus.mutate({ id: selected._id, status, adminNote: note });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-serif font-bold text-gray-800">Manage Bookings</h1>
        <div className="flex gap-2">
          {["", "pending", "confirmed", "rejected", "cancelled", "completed"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${statusFilter === s ? "bg-gold text-white" : "bg-white text-gray-600 hover:bg-gray-100 border"}`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Name","Event","Date","Package","Guests","Amount","Status","Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.bookings?.map(b => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{b.contactName}</div>
                    <div className="text-xs text-gray-400">{b.contactPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.eventType}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(b.eventDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-600">{b.package?.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{b.guestCount}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">₹{b.totalAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelected(b); setNote(b.adminNote || ""); }}
                      className="text-xs text-gold border border-gold px-3 py-1 rounded-lg hover:bg-gold hover:text-white transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.bookings?.length && (
            <p className="text-center py-12 text-gray-400">No bookings found.</p>
          )}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Booking Status</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm space-y-1">
              <p><strong>Name:</strong> {selected.contactName}</p>
              <p><strong>Event:</strong> {selected.eventType} on {new Date(selected.eventDate).toDateString()}</p>
              <p><strong>Package:</strong> {selected.package?.name}</p>
              <p><strong>Guests:</strong> {selected.guestCount}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (optional)</label>
              <textarea
                value={note} onChange={e => setNote(e.target.value)}
                rows={2} placeholder="Add a note for the customer..."
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => handleAction("confirmed")}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600">
                Confirm
              </button>
              <button onClick={() => handleAction("rejected")}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600">
                Reject
              </button>
              <button onClick={() => handleAction("completed")}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
                Complete
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
