import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../../services/api";
import toast from "react-hot-toast";
import { FaTrash, FaEye, FaEyeSlash, FaStar, FaPlus } from "react-icons/fa";

export default function ManageTestimonials() {
  const qc  = useQueryClient();
  const ref = useRef();
  const [saving, setSaving]   = useState(false);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm]       = useState({ name:"", message:"", rating:"5", eventType:"" });

  const { data } = useQuery("adminTestimonials", () =>
    api.get("/content/admin/testimonials").then(r => r.data.testimonials)
  );

  const toggleVis = useMutation(
    ({ id, isVisible }) => api.put(`/content/admin/testimonials/${id}`, { isVisible }),
    { onSuccess: () => { toast.success("Updated"); qc.invalidateQueries("adminTestimonials"); } }
  );

  const deleteTes = useMutation(
    id => api.delete(`/content/admin/testimonials/${id}`),
    { onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries("adminTestimonials"); } }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.message) return toast.error("Name and message required");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (file) fd.append("image", file);
      await api.post("/content/admin/testimonials", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Testimonial added!");
      setForm({ name:"", message:"", rating:"5", eventType:"" });
      setFile(null); setPreview(null);
      if (ref.current) ref.current.value = "";
      qc.invalidateQueries("adminTestimonials");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-serif font-bold text-gray-800 mb-8">Manage Testimonials</h1>

      {/* Add form */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FaPlus size={14}/> Add Testimonial</h2>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
            <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
              className="input-field" placeholder="Mr. / Mrs. ..."/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <input type="text" value={form.eventType} onChange={e=>setForm({...form,eventType:e.target.value})}
              className="input-field" placeholder="e.g. Wedding, Reception"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} className="input-field">
              {[5,4,3,2,1].map(r=><option key={r} value={r}>{r} Stars</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
            <input type="file" accept="image/*" ref={ref} onChange={e=>{
              const f=e.target.files[0];
              if(f){setFile(f);setPreview(URL.createObjectURL(f));}
            }} className="text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gold/10 file:text-gold file:text-sm file:cursor-pointer"/>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
              rows={3} className="input-field resize-none" placeholder="Customer's review..."/>
          </div>
          {preview && <img src={preview} className="w-16 h-16 rounded-full object-cover border"/>}
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="btn-gold disabled:opacity-60">
              {saving ? "Saving..." : "Add Testimonial"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.map(t => (
          <div key={t._id} className={`bg-white rounded-2xl shadow-sm p-5 ${!t.isVisible?"opacity-50":""}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-1">
                {Array.from({length:t.rating}).map((_,i)=><FaStar key={i} className="text-gold" size={12}/>)}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>toggleVis.mutate({id:t._id,isVisible:!t.isVisible})}
                  className="text-gray-400 hover:text-gold transition-colors">
                  {t.isVisible?<FaEye size={14}/>:<FaEyeSlash size={14}/>}
                </button>
                <button onClick={()=>{if(confirm("Delete?"))deleteTes.mutate(t._id);}}
                  className="text-gray-400 hover:text-red-500 transition-colors">
                  <FaTrash size={14}/>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">"{t.message}"</p>
            <div className="flex items-center gap-2">
              {t.imageUrl
                ? <img src={t.imageUrl} className="w-8 h-8 rounded-full object-cover"/>
                : <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold">{t.name[0]}</div>
              }
              <div>
                <p className="font-medium text-xs text-gray-800">{t.name}</p>
                {t.eventType && <p className="text-xs text-gray-400">{t.eventType}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!data?.length && <p className="text-center py-12 text-gray-400">No testimonials yet.</p>}
    </div>
  );
}
