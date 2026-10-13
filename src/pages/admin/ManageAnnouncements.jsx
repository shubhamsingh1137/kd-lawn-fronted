import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  message: "",
  isEnabled: true,
  backgroundColor: "#8B1E3F",
  textColor: "#FFFFFF",
  speed: 30,
  direction: "left",
  startsAt: "",
  endsAt: "",
  priority: 0,
};

function toLocalInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get("/announcements/admin/all");
      setAnnouncements(response.data?.announcements || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Announcements not load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.message.trim()) {
      toast.error("Announcement message required");
      return;
    }
    if (form.startsAt && form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt)) {
      toast.error("The end date should be after the start date.");
      return;
    }

    const payload = {
      ...form,
      speed: Number(form.speed),
      priority: Number(form.priority),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/announcements/admin/${editingId}`, payload);
        toast.success("Announcement updated");
      } else {
        await api.post("/announcements/admin", payload);
        toast.success("Announcement created");
      }
      resetForm();
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || "Announcement not saved");
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      message: item.message || "",
      isEnabled: Boolean(item.isEnabled),
      backgroundColor: item.backgroundColor || "#8B1E3F",
      textColor: item.textColor || "#FFFFFF",
      speed: item.speed || 30,
      direction: item.direction || "left",
      startsAt: toLocalInputValue(item.startsAt),
      endsAt: toLocalInputValue(item.endsAt),
      priority: item.priority ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (id) => {
    try {
      const response = await api.patch(`/announcements/admin/${id}/toggle`);
      toast.success(response.data?.message || "Status updated");
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || "Status not updated");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.message}"?`)) return;
    try {
      await api.delete(`/announcements/admin/${item._id}`);
      toast.success("Announcement deleted");
      if (editingId === item._id) resetForm();
      await loadAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || "Announcement not deleted");
    }
  };

  const inputClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="min-h-full p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          
          <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">Manage Announcements</h1>
          <p className="mt-2 text-sm text-gray-500">Manage scrolling offers, festive greetings, and booking announcements on the homepage.</p>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Edit announcement" : "Create announcement"}</h2>
            {editingId && <button type="button" onClick={resetForm} className="text-sm font-medium text-gray-500 hover:text-gray-900">Cancel edit</button>}
          </div>

          <div>
            <label className={labelClass}>Announcement message *</label>
            <textarea name="message" value={form.message} onChange={change} maxLength={500} required rows={3} placeholder="🎉 Wedding Season Special — Get 5% OFF!" className={inputClass} />
            <p className="mt-1 text-right text-xs text-gray-400">{form.message.length}/500</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>Background color</label>
              <input type="color" name="backgroundColor" value={form.backgroundColor} onChange={change} className="mt-2 h-11 w-full cursor-pointer rounded border p-1" />
            </div>
            <div>
              <label className={labelClass}>Text color</label>
              <input type="color" name="textColor" value={form.textColor} onChange={change} className="mt-2 h-11 w-full cursor-pointer rounded border p-1" />
            </div>
            <div>
              <label className={labelClass}>Scroll speed (seconds)</label>
              <input type="number" name="speed" min="5" max="120" value={form.speed} onChange={change} className={inputClass} />
              <p className="mt-1 text-xs text-gray-400">Kam value = faster scrolling</p>
            </div>
            <div>
              <label className={labelClass}>Direction</label>
              <select name="direction" value={form.direction} onChange={change} className={inputClass}>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Start date/time (optional)</label>
              <input type="datetime-local" name="startsAt" value={form.startsAt} onChange={change} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End date/time (optional)</label>
              <input type="datetime-local" name="endsAt" value={form.endsAt} onChange={change} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <input type="number" name="priority" value={form.priority} onChange={change} className={inputClass} />
              <p className="mt-1 text-xs text-gray-400">Higher priority appears first</p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-gray-50 p-3">
            <input type="checkbox" name="isEnabled" checked={form.isEnabled} onChange={change} className="h-4 w-4 accent-amber-600" />
            <span>
              <span className="block text-sm font-semibold text-gray-800">Enable this announcement</span>
              <span className="block text-xs text-gray-500">Off hone par homepage par nahi dikhega.</span>
            </span>
          </label>

          <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: form.backgroundColor, color: form.textColor }}>
            <div className="px-4 py-3 text-center text-sm font-semibold">{form.message || "Your announcement preview will appear here"}</div>
          </div>

          <button disabled={saving} className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Update announcement" : "Create announcement"}
          </button>
        </form>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">All announcements</h2>
            <button onClick={loadAnnouncements} type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">Refresh</button>
          </div>

          {loading ? <p className="py-8 text-center text-sm text-gray-500">Loading announcements...</p> :
            announcements.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Abhi koi announcement nahi hai. Upar se pehla announcement banayein.</p> :
            <div className="space-y-3">
              {announcements.map((item) => (
                <article key={item._id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {item.isEnabled ? "Enabled" : "Disabled"}
                        </span>
                        <span className="text-xs text-gray-500">Priority: {item.priority ?? 0}</span>
                      </div>
                      <div className="rounded-lg px-3 py-3 text-sm font-semibold" style={{ backgroundColor: item.backgroundColor || "#8B1E3F", color: item.textColor || "#FFFFFF" }}>{item.message}</div>
                      <p className="mt-2 text-xs text-gray-500">Direction: {item.direction || "left"} · Speed: {item.speed || 30}s</p>
                      {(item.startsAt || item.endsAt) && <p className="mt-1 text-xs text-gray-500">Start: {item.startsAt ? new Date(item.startsAt).toLocaleString("en-IN") : "Immediately"} · End: {item.endsAt ? new Date(item.endsAt).toLocaleString("en-IN") : "No end date"}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => toggle(item._id)} type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">{item.isEnabled ? "Disable" : "Enable"}</button>
                      <button onClick={() => edit(item)} type="button" className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200">Edit</button>
                      <button onClick={() => remove(item)} type="button" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          }
        </section>
      </div>
    </div>
  );
}
