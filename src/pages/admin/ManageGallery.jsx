import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "../../services/api";
import toast from "react-hot-toast";
import { FaTrash, FaEye, FaEyeSlash, FaUpload } from "react-icons/fa";

const CATEGORIES = ["wedding", "reception", "decoration", "food", "venue", "other"];

export default function ManageGallery() {
  const qc     = useQueryClient();
  const ref    = useRef();
  const [form, setForm]     = useState({ title: "", category: "venue" });
  const [file, setFile]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery("adminGallery", () =>
    api.get("/gallery/admin/all").then(r => r.data.images)
  );

  const toggleVisibility = useMutation(
    ({ id, isVisible }) => api.put(`/gallery/admin/${id}`, { isVisible }),
    { onSuccess: () => { toast.success("Visibility updated"); qc.invalidateQueries("adminGallery"); } }
  );

  const deleteImage = useMutation(
    (id) => api.delete(`/gallery/admin/${id}`),
    {
      onSuccess: () => { toast.success("Image deleted"); qc.invalidateQueries("adminGallery"); },
      onError: () => toast.error("Delete failed"),
    }
  );

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an image");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image",    file);
      fd.append("title",    form.title || "Gallery Image");
      fd.append("category", form.category);
      await api.post("/gallery/admin", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Image uploaded!");
      setFile(null); setPreview(null);
      setForm({ title: "", category: "venue" });
      if (ref.current) ref.current.value = "";
      qc.invalidateQueries("adminGallery");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-serif font-bold text-gray-800 mb-8">Manage Gallery</h1>

      {/* Upload form */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload New Image</h2>
        <form onSubmit={handleUpload} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
            <input type="file" accept="image/*" ref={ref} onChange={handleFileChange}
              className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold file:text-white file:cursor-pointer file:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Image title" className="input-field w-48"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="input-field w-40">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          {preview && <img src={preview} alt="preview" className="w-16 h-16 rounded-lg object-cover border"/>}
          <button type="submit" disabled={uploading}
            className="btn-gold flex items-center gap-2 disabled:opacity-60">
            <FaUpload size={14}/> {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Images grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.map((img) => (
            <div key={img._id} className={`relative group rounded-xl overflow-hidden shadow-sm ${!img.isVisible ? "opacity-50" : ""}`}>
              <img src={img.imageUrl} alt={img.title} className="w-full h-48 object-cover"/>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => toggleVisibility.mutate({ id: img._id, isVisible: !img.isVisible })}
                  className="bg-white text-gray-800 p-2 rounded-full hover:bg-yellow-400 transition-colors"
                  title={img.isVisible ? "Hide" : "Show"}
                >
                  {img.isVisible ? <FaEye size={14}/> : <FaEyeSlash size={14}/>}
                </button>
                <button
                  onClick={() => { if(confirm("Delete this image?")) deleteImage.mutate(img._id); }}
                  className="bg-white text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                >
                  <FaTrash size={14}/>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-2">
                <p className="text-white text-xs truncate">{img.title}</p>
                <p className="text-gray-300 text-xs capitalize">{img.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && !data?.length && (
        <p className="text-center py-16 text-gray-400">No images uploaded yet.</p>
      )}
    </div>
  );
}
