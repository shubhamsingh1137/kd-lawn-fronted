import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../../services/api";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const EMPTY = { name:"", description:"", price:"", features:"", capacityMin:"50", capacityMax:"500", isActive:true, isFeatured:false };

export default function ManagePackages() {
  const qc = useQueryClient();
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery("adminPackages", () =>
    api.get("/packages/admin/all").then(r => r.data.packages)
  );

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (pkg) => {
    setEditing(pkg);
    setForm({
      name: pkg.name, description: pkg.description || "",
      price: pkg.price, features: pkg.features.join("\n"),
      capacityMin: pkg.capacity.min, capacityMax: pkg.capacity.max,
      isActive: pkg.isActive, isFeatured: pkg.isFeatured,
    });
    setModal(true);
  };

  const deletePkg = useMutation(id => api.delete(`/packages/admin/${id}`), {
    onSuccess: () => { toast.success("Package deleted"); qc.invalidateQueries("adminPackages"); },
  });

  const handleSave = async () => {
    if (!form.name || !form.price) return toast.error("Name and price required");
    setSaving(true);
    const payload = {
      name: form.name, description: form.description,
      price: Number(form.price),
      features: form.features.split("\n").map(f => f.trim()).filter(Boolean),
      capacity: { min: Number(form.capacityMin), max: Number(form.capacityMax) },
      isActive: form.isActive, isFeatured: form.isFeatured,
    };
    try {
      if (editing) {
        await api.put(`/packages/admin/${editing._id}`, payload);
        toast.success("Package updated");
      } else {
        await api.post("/packages/admin", payload);
        toast.success("Package created");
      }
      qc.invalidateQueries("adminPackages");
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-serif font-bold text-gray-800">Manage Packages</h1>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2">
          <FaPlus size={12}/> Add Package
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data?.map(pkg => (
          <div key={pkg._id} className={`bg-white rounded-2xl shadow-sm p-6 ${!pkg.isActive ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{pkg.name}</h3>
                <p className="text-gold font-bold text-xl mt-1">₹{pkg.price.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex gap-2">
                {pkg.isFeatured && <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Featured</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">{pkg.capacity.min}–{pkg.capacity.max} guests</p>
            <ul className="space-y-1 mb-4">
              {pkg.features.map((f,i) => <li key={i} className="text-xs text-gray-600">• {f}</li>)}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => openEdit(pkg)}
                className="flex-1 flex items-center justify-center gap-1 border border-gold text-gold py-2 rounded-lg text-xs hover:bg-gold hover:text-white transition-colors">
                <FaEdit size={11}/> Edit
              </button>
              <button onClick={() => { if(confirm("Delete package?")) deletePkg.mutate(pkg._id); }}
                className="flex-1 flex items-center justify-center gap-1 border border-red-200 text-red-500 py-2 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-colors">
                <FaTrash size={11}/> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editing ? "Edit Package" : "Create Package"}
            </h2>
            <div className="space-y-4">
              {[
                {label:"Package Name", key:"name",  type:"text"},
                {label:"Price (₹)",   key:"price", type:"number"},
                {label:"Min Guests",  key:"capacityMin", type:"number"},
                {label:"Max Guests",  key:"capacityMax", type:"number"},
              ].map(({label,key,type}) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
                    className="input-field"/>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  className="input-field"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                <textarea value={form.features} onChange={e=>setForm({...form,features:e.target.value})}
                  rows={5} className="input-field resize-none"
                  placeholder={"Decoration\nCatering for 200\nParking\n..."}/>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})} className="accent-gold"/>
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})} className="accent-gold"/>
                  Featured
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-gold flex-1 disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={()=>setModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
