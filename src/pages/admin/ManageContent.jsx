import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import api from "../../services/api";
import toast from "react-hot-toast";

const SECTIONS = [
  { key: "hero",  label: "Hero Banner",  fields: ["title","subtitle","description","buttonText"] },
  { key: "about", label: "About Section",fields: ["title","description"] },
  { key: "cta",   label: "CTA Section",  fields: ["title","description"] },
];

function SectionEditor({ section }) {
  const qc = useQueryClient();
  const [saving, setSaving]   = useState(false);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm]       = useState({
    title: section.data?.title || "",
    subtitle: section.data?.subtitle || "",
    description: section.data?.description || "",
    buttonText: section.data?.buttonText || "",
    isVisible: section.data?.isVisible ?? true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("image", file);
      await api.put(`/content/admin/${section.key}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${section.label} updated!`);
      qc.invalidateQueries("allContent");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{section.label}</h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={form.isVisible}
            onChange={e => setForm({...form, isVisible: e.target.checked})}
            className="accent-gold w-4 h-4"
          />
          Visible on site
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {section.fields.map(f => (
          <div key={f}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{f}</label>
            {f === "description" ? (
              <textarea value={form[f] || ""} onChange={e => setForm({...form, [f]: e.target.value})}
                rows={3} className="input-field resize-none"/>
            ) : (
              <input type="text" value={form[f] || ""} onChange={e => setForm({...form, [f]: e.target.value})}
                className="input-field"/>
            )}
          </div>
        ))}
      </div>

      {/* Image upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Background / Section Image</label>
        <div className="flex items-center gap-4">
          <input type="file" accept="image/*" onChange={e => {
            const f = e.target.files[0];
            if(f) { setFile(f); setPreview(URL.createObjectURL(f)); }
          }} className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gold/10 file:text-gold file:text-sm file:cursor-pointer"/>
          {(preview || section.data?.imageUrl) && (
            <img src={preview || section.data.imageUrl} alt="preview"
              className="w-20 h-12 rounded-lg object-cover border"/>
          )}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="btn-gold py-2 px-6 rounded-lg disabled:opacity-60">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

export default function ManageContent() {
  const { data, isLoading } = useQuery("allContent", () =>
    api.get("/content/admin/all").then(r => r.data.content)
  );

  const getSection = (key) => ({
    key,
    label: SECTIONS.find(s => s.key === key)?.label || key,
    fields: SECTIONS.find(s => s.key === key)?.fields || [],
    data: data?.find(c => c.section === key),
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-serif font-bold text-gray-800 mb-2">Site Content</h1>
      <p className="text-gray-500 text-sm mb-8">Changes here reflect immediately on the homepage.</p>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map(s => (
            <SectionEditor key={s.key} section={getSection(s.key)}/>
          ))}
        </div>
      )}
    </div>
  );
}
