import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../../services/api";
import toast from "react-hot-toast";
import { FaBan, FaCheckCircle, FaTrash, FaSearch } from "react-icons/fa";

export default function ManageUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useQuery(
    ["adminUsers", debouncedSearch],
    () => api.get(`/users/admin/all${debouncedSearch ? `?search=${debouncedSearch}` : ""}`).then(r => r.data)
  );

  const blockToggle = useMutation(id => api.patch(`/users/admin/${id}/block`), {
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries("adminUsers"); },
    onError: () => toast.error("Failed"),
  });

  const deleteUser = useMutation(id => api.delete(`/users/admin/${id}`), {
    onSuccess: () => { toast.success("User deleted"); qc.invalidateQueries("adminUsers"); },
    onError: () => toast.error("Delete failed"),
  });

  const handleSearch = (e) => {
    setSearch(e.target.value);
    clearTimeout(window._st);
    window._st = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-800">Manage Users</h1>
        <span className="text-sm text-gray-500">{data?.total || 0} total users</span>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
        <input
          type="text" value={search} onChange={handleSearch}
          placeholder="Search by name or email..."
          className="input-field pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i=><div key={i} className="h-16 bg-white rounded-xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Name","Email","Phone","Joined","Status","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.users?.map(u => (
                <tr key={u._id} className={`hover:bg-gray-50 ${u.isBlocked ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${u.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => blockToggle.mutate(u._id)}
                        className={`p-2 rounded-lg transition-colors text-xs
                          ${u.isBlocked
                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                            : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"}`}
                        title={u.isBlocked ? "Unblock" : "Block"}
                      >
                        {u.isBlocked ? <FaCheckCircle size={14}/> : <FaBan size={14}/>}
                      </button>
                      <button
                        onClick={() => { if(confirm("Delete user permanently?")) deleteUser.mutate(u._id); }}
                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <FaTrash size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.users?.length && (
            <p className="text-center py-12 text-gray-400">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
