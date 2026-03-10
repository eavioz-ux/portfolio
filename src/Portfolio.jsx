import { useState, useEffect, useRef, useCallback } from "react";
import { PROFILE as DATA_PROFILE, SKILLS as DATA_SKILLS, PROJECTS as DATA_PROJECTS } from "./data.js";

/* ══════════════ DEFAULT DATA (from data.js) ══════════════ */
const DEFAULT_PROFILE = DATA_PROFILE;
const DEFAULT_SKILLS = DATA_SKILLS;

/* ══════════════ STORAGE ══════════════ */
async function loadData(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
async function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {
    if (e.name === "QuotaExceededError") alert("Storage full. Try removing some projects or using smaller images/videos.");
    console.error("Save:", e);
  }
}

/* ══════════════ FILE HELPERS ══════════════ */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Compress images to max 800px wide, JPEG quality 0.7 — saves ~80% storage
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isDataUrl(str) { return str && str.startsWith("data:"); }
function isYouTubeOrVimeo(url) { return url && (/youtube\.com|youtu\.be|vimeo\.com/).test(url); }

function toEmbedUrl(url) {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return "https://www.youtube.com/embed/" + ytMatch[1];
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return "https://player.vimeo.com/video/" + vimeoMatch[1];
  return url;
}

/* ══════════════ HOOKS ══════════════ */
function useReveal() {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return [ref, v];
}

/* ══════════════ BACKGROUND ══════════════ */
function GridBG() {
  return <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.035 }}><svg width="100%" height="100%"><defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#fff" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg></div>;
}
function GlowOrb({ top, left, color, size }) {
  return <div style={{ position: "absolute", top, left, width: size || 500, height: size || 500, background: color, borderRadius: "50%", filter: "blur(120px)", opacity: 0.07, pointerEvents: "none" }} />;
}

/* ══════════════ STYLES ══════════════ */
const F = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const inputStyle = { width: "100%", padding: "10px 14px", background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#eee", fontSize: 14, outline: "none", fontFamily: "inherit" };
const labelStyle = { fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" };
const pillBtn = (active) => ({ background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)", color: active ? "#f5f5f7" : "#666", border: active ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "8px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", fontFamily: F });
const uploadBtnStyle = { padding: "8px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#aaa", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 6 };

/* ══════════════ PROFILE SETTINGS ══════════════ */
function ProfileSettings({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: "50px 20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, maxWidth: 540, width: "100%", padding: "32px 28px 36px", animation: "modalIn 0.35s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f7" }}>Profile Settings</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#888", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>X</button>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>First Name</label><input style={inputStyle} value={form.firstName} onChange={e => set("firstName", e.target.value)} /></div>
            <div><label style={labelStyle}>Last Name</label><input style={inputStyle} value={form.lastName} onChange={e => set("lastName", e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Tagline</label><input style={inputStyle} value={form.tagline} onChange={e => set("tagline", e.target.value)} /></div>
          <div><label style={labelStyle}>Hero Description</label><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.bio} onChange={e => set("bio", e.target.value)} /></div>
          <div><label style={labelStyle}>About Me Text</label><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.aboutText} onChange={e => set("aboutText", e.target.value)} /></div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Links & Contact</span></div>
          <div><label style={labelStyle}>Email</label><input style={inputStyle} value={form.email} onChange={e => set("email", e.target.value)} /></div>
          <div><label style={labelStyle}>LinkedIn URL</label><input style={inputStyle} value={form.linkedin} onChange={e => set("linkedin", e.target.value)} /></div>
          <div><label style={labelStyle}>GitHub URL</label><input style={inputStyle} value={form.github} onChange={e => set("github", e.target.value)} /><p style={{ fontSize: 11, color: "#444", marginTop: 4 }}>Leave empty to hide</p></div>
          <div><label style={labelStyle}>CV / Resume</label>
            <input style={inputStyle} value={isDataUrl(form.cvUrl) ? "" : form.cvUrl} onChange={e => set("cvUrl", e.target.value)} placeholder="Paste a URL (Google Drive, Dropbox)" />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: "#444" }}>or</span>
              <label style={uploadBtnStyle}>Upload PDF<input type="file" accept=".pdf" style={{ display: "none" }} onChange={async e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 4*1024*1024) { alert("Max 4MB. Use Google Drive for larger files."); return; } set("cvUrl", await fileToBase64(f)); }} /></label>
              {form.cvUrl && <span style={{ fontSize: 11, color: "#30d158" }}>{isDataUrl(form.cvUrl) ? "Uploaded" : "URL set"}</span>}
            </div>
            <p style={{ fontSize: 11, color: "#444", marginTop: 6 }}>Leave empty to hide. For Drive: upload, share as "Anyone with link", paste URL.</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 24px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#aaa", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} style={{ padding: "10px 28px", background: "#fff", border: "none", borderRadius: 10, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════ SKILLS ══════════════ */
function SkillBadge({ skill, onRemove }) {
  const [h, setH] = useState(false);
  const cc = { Programming: "#3b82f6", Electronics: "#f59e0b", Communication: "#8b5cf6", Robotics: "#10b981", Creative: "#ec4899", Fabrication: "#f97316" };
  const c = cc[skill.category] || "#666";
  return <span onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: c + "12", border: "1px solid " + c + "30", color: c, fontSize: 13, fontWeight: 500, cursor: onRemove ? "pointer" : "default" }}>{skill.name}{onRemove && h && <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ marginLeft: 2, fontSize: 14, opacity: 0.7 }}>x</span>}</span>;
}

function AddSkillInline({ onAdd, onCancel }) {
  const [name, setName] = useState(""); const [cat, setCat] = useState("Electronics");
  const cats = ["Programming", "Electronics", "Communication", "Robotics", "Creative", "Fabrication"];
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input style={{ ...inputStyle, flex: "1 1 200px" }} placeholder="Skill name..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && name.trim()) { onAdd({ id: "s-" + Date.now(), name: name.trim(), category: cat }); setName(""); } }} autoFocus />
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...inputStyle, width: "auto", flex: "0 0 auto", cursor: "pointer" }}>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <button onClick={() => { if (name.trim()) { onAdd({ id: "s-" + Date.now(), name: name.trim(), category: cat }); setName(""); } }} style={{ padding: "10px 20px", background: "#fff", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: F, opacity: name.trim() ? 1 : 0.4 }}>Add</button>
        <button onClick={onCancel} style={{ padding: "10px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: F }}>Done</button>
      </div>
    </div>
  );
}

function SkillsSection({ skills, onUpdate, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const cats = [...new Set(skills.map(s => s.category))];
  const cc = { Programming: "#3b82f6", Electronics: "#f59e0b", Communication: "#8b5cf6", Robotics: "#10b981", Creative: "#ec4899", Fabrication: "#f97316" };

  // Hide entirely for visitors when no skills
  if (skills.length === 0 && !isAdmin) return null;

  return (
    <section id="skills" style={{ scrollMarginTop: 64, maxWidth: 900, margin: "0 auto", padding: "0 24px 80px", position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Skills & Expertise</h2>
        {isAdmin && <button onClick={() => setEditing(!editing)} style={{ padding: "7px 18px", borderRadius: 20, background: editing ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: editing ? "#fff" : "#888", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: F }}>{editing ? "Done Editing" : "Edit Skills"}</button>}
      </div>
      {skills.length === 0 && isAdmin && !editing && <p style={{ color: "#444", fontSize: 14, marginBottom: 16 }}>No skills yet. Click "Edit Skills" to start adding.</p>}
      {cats.map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: cc[cat] || "#666" }} /><span style={{ fontSize: 13, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{cat}</span></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{skills.filter(s => s.category === cat).map(s => <SkillBadge key={s.id} skill={s} onRemove={editing ? () => onUpdate(skills.filter(x => x.id !== s.id)) : null} />)}</div>
        </div>
      ))}
      {editing && <AddSkillInline onAdd={s => onUpdate([...skills, s])} onCancel={() => setEditing(false)} />}
    </section>
  );
}

/* ══════════════ PROJECT COMPONENTS ══════════════ */
function SpecTable({ specs }) {
  const e = Object.entries(specs || {}); if (!e.length) return null;
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden", marginTop: 16 }}>{e.map(([k, v]) => <div key={k} style={{ background: "#141416", padding: "10px 14px" }}><div style={{ fontSize: 11, color: "#666", letterSpacing: 0.5, textTransform: "uppercase" }}>{k}</div><div style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0", marginTop: 2 }}>{v}</div></div>)}</div>;
}

function ChallengeCard({ c, i }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px", marginTop: i > 0 ? 10 : 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><span style={{ background: "#ff453a", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2, letterSpacing: 0.5 }}>PROBLEM</span><span style={{ fontSize: 14, color: "#ccc", lineHeight: 1.5 }}>{c.problem}</span></div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10 }}><span style={{ background: "#30d158", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2, letterSpacing: 0.5 }}>SOLUTION</span><span style={{ fontSize: 14, color: "#999", lineHeight: 1.5 }}>{c.solution}</span></div>
    </div>
  );
}

function MediaGallery({ media, videoUrl }) {
  const [idx, setIdx] = useState(0);
  const items = [];
  if (videoUrl) items.push({ type: "video", url: videoUrl });
  (media || []).forEach(u => items.push({ type: "image", url: u }));
  if (!items.length) return null;
  const a = items[idx] || items[0];
  const isEmbed = a.type === "video" && isYouTubeOrVimeo(a.url);
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
        {a.type === "video" ? (
          isEmbed ? <iframe src={toEmbedUrl(a.url)} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          : <video src={a.url} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : <img src={a.url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
      </div>
      {items.length > 1 && <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
        {items.map((item, i) => <div key={i} onClick={() => setIdx(i)} style={{ width: 64, height: 44, borderRadius: 6, overflow: "hidden", cursor: "pointer", border: idx === i ? "2px solid #fff" : "2px solid transparent", opacity: idx === i ? 1 : 0.5, transition: "all 0.2s", flexShrink: 0 }}>
          {item.type === "video" ? <div style={{ width: "100%", height: "100%", background: "#1c1c1e", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></div> : <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>)}
      </div>}
    </div>
  );
}

/* ══════════════ PROJECT MODAL ══════════════ */
function ProjectModal({ project, onClose, onEdit, onDelete, isAdmin }) {
  useEffect(() => { document.body.style.overflow = "hidden"; const h = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", h); }; }, [onClose]);
  const p = project;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: "60px 20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1c1c1e", borderRadius: 20, maxWidth: 720, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", animation: "modalIn 0.35s ease", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ position: "relative", width: "100%", height: 260, overflow: "hidden" }}>
          {p.thumbnail ? <img src={p.thumbnail} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1c1c1e, #2c2c2e)" }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 30%, rgba(0,0,0,0.8))" }} />
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
            {isAdmin && <button onClick={onEdit} style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Edit</button>}
            {isAdmin && <button onClick={onDelete} style={{ background: "rgba(255,59,48,0.2)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: 8, padding: "6px 14px", color: "#ff453a", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Delete</button>}
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>X</button>
          </div>
          <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
            <span style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{p.category}</span>
            <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>{p.title}</h2>
          </div>
        </div>
        <div style={{ padding: "24px 28px 36px" }}>
          {p.techStack?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>{p.techStack.map(t => <span key={t} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{t}</span>)}</div>}
          {p.description && <p style={{ fontSize: 15, lineHeight: 1.7, color: "#bbb" }}>{p.description}</p>}
          <MediaGallery media={p.media} videoUrl={p.videoUrl} />
          {p.specs && Object.keys(p.specs).length > 0 && <><h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, color: "#555", marginTop: 28, marginBottom: 4 }}>Technical Specifications</h3><SpecTable specs={p.specs} /></>}
          {p.challenges?.length > 0 && <><h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, color: "#555", marginTop: 28, marginBottom: 12 }}>Key Challenges & Solutions</h3>{p.challenges.map((c, i) => <ChallengeCard key={i} c={c} i={i} />)}</>}
          {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24, padding: "10px 20px", background: "#fff", color: "#000", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>View Source Code</a>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════ PROJECT FORM (file uploads) ══════════════ */
function ProjectForm({ onSave, onCancel, initial }) {
  const toForm = (p) => p ? { ...p, techStackStr: (p.techStack || []).join(", "), specsStr: Object.entries(p.specs || {}).map(([k, v]) => k + ": " + v).join("\n"), challenges: p.challenges?.length > 0 ? p.challenges : [{ problem: "", solution: "" }], photos: p.media || [], videoData: p.videoUrl || "" } : { title: "", category: "", thumbnail: "", summary: "", description: "", techStackStr: "", github: "", challenges: [{ problem: "", solution: "" }], specsStr: "", photos: [], videoData: "" };
  const [form, setForm] = useState(() => toForm(initial));
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setChallenge = (idx, field, val) => setForm(prev => { const ch = [...prev.challenges]; ch[idx] = { ...ch[idx], [field]: val }; return { ...prev, challenges: ch }; });
  const addChallenge = () => setForm(prev => ({ ...prev, challenges: [...prev.challenges, { problem: "", solution: "" }] }));
  const removeChallenge = (idx) => setForm(prev => ({ ...prev, challenges: prev.challenges.filter((_, i) => i !== idx) }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const newPhotos = await Promise.all(files.map(f => compressImage(f)));
      setForm(prev => {
        const updated = [...prev.photos, ...newPhotos];
        return { ...prev, photos: updated, thumbnail: prev.thumbnail || updated[0] };
      });
    } catch (err) { alert("Error uploading photos: " + err.message); }
    setUploading(false);
    e.target.value = "";
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert("Video must be under 15MB for direct upload."); return; }
    setUploading(true);
    try { set("videoData", await fileToBase64(file)); } catch (err) { alert("Error: " + err.message); }
    setUploading(false);
    e.target.value = "";
  };

  const removePhoto = (idx) => {
    setForm(prev => {
      const updated = prev.photos.filter((_, i) => i !== idx);
      const removedUrl = prev.photos[idx];
      return { ...prev, photos: updated, thumbnail: prev.thumbnail === removedUrl ? (updated[0] || "") : prev.thumbnail };
    });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const specsObj = {}; form.specsStr.split("\n").forEach(line => { const i = line.indexOf(":"); if (i > 0) specsObj[line.slice(0, i).trim()] = line.slice(i + 1).trim(); });
    onSave({ id: initial?.id || ("proj-" + Date.now()), title: form.title.trim(), category: form.category.trim() || "General", thumbnail: form.thumbnail || form.photos[0] || "", summary: form.summary.trim(), description: form.description.trim(), techStack: form.techStackStr.split(",").map(s => s.trim()).filter(Boolean), challenges: form.challenges.filter(c => c.problem.trim() || c.solution.trim()), specs: specsObj, github: form.github.trim(), videoUrl: form.videoData, media: form.photos });
  };

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: "50px 20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, maxWidth: 640, width: "100%", padding: "32px 28px 36px", animation: "modalIn 0.35s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f7" }}>{initial ? "Edit Project" : "Add New Project"}</h2>
          <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#888", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>X</button>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Project Title *</label><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Line-Following Robot" /></div>
            <div><label style={labelStyle}>Category</label><input style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Robotics" /></div>
          </div>

          {/* Photo upload */}
          <div>
            <label style={labelStyle}>Photos</label>
            <label style={uploadBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              {uploading ? "Uploading..." : "Upload Photos"}
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} disabled={uploading} />
            </label>
            {form.photos.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>Click to set as cover photo. X to remove.</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {form.photos.map((url, i) => {
                    const isCover = form.thumbnail === url;
                    return (
                      <div key={i} style={{ position: "relative", width: 80, height: 56, borderRadius: 8, overflow: "hidden", border: isCover ? "2.5px solid #3b82f6" : "2.5px solid rgba(255,255,255,0.08)", opacity: isCover ? 1 : 0.6, cursor: "pointer", transition: "all 0.2s", boxShadow: isCover ? "0 0 12px rgba(59,130,246,0.3)" : "none" }}>
                        <img src={url} alt="" onClick={() => set("thumbnail", url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {isCover && <div style={{ position: "absolute", top: 2, left: 2, background: "#3b82f6", borderRadius: 4, padding: "1px 5px", fontSize: 8, color: "#fff", fontWeight: 700 }}>COVER</div>}
                        <button onClick={(e) => { e.stopPropagation(); removePhoto(i); }} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: 18, height: 18, color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>x</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Video upload */}
          <div>
            <label style={labelStyle}>Video</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={uploadBtnStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                {uploading ? "Uploading..." : "Upload Video"}
                <input type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoUpload} disabled={uploading} />
              </label>
              {form.videoData && <span style={{ fontSize: 11, color: "#30d158" }}>Video attached</span>}
              {form.videoData && <button onClick={() => set("videoData", "")} style={{ background: "none", border: "none", color: "#ff453a", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Remove</button>}
            </div>
            <p style={{ fontSize: 11, color: "#444", marginTop: 6 }}>Upload directly from your phone or camera. Max 15MB per video.</p>
          </div>

          <div><label style={labelStyle}>Short Summary</label><textarea style={{ ...inputStyle, minHeight: 56, resize: "vertical" }} value={form.summary} onChange={e => set("summary", e.target.value)} placeholder="One-liner..." /></div>
          <div><label style={labelStyle}>Full Description</label><textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="What you built, how, what you learned..." /></div>
          <div><label style={labelStyle}>Tech Stack (comma-separated)</label><input style={inputStyle} value={form.techStackStr} onChange={e => set("techStackStr", e.target.value)} placeholder="Arduino, Servo, IR Sensor" /></div>
          <div><label style={labelStyle}>Specs (Key: Value per line)</label><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "monospace", fontSize: 13 }} value={form.specsStr} onChange={e => set("specsStr", e.target.value)} placeholder={"MCU: Arduino Uno\nSensors: IR Array"} /></div>
          <div><label style={labelStyle}>Challenges & Solutions</label>
            {form.challenges.map((ch, idx) => <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, marginTop: idx > 0 ? 8 : 0 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 700, color: "#555" }}>CHALLENGE {idx + 1}</span>{form.challenges.length > 1 && <button onClick={() => removeChallenge(idx)} style={{ background: "none", border: "none", color: "#ff453a", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Remove</button>}</div><input style={{ ...inputStyle, marginBottom: 6 }} value={ch.problem} onChange={e => setChallenge(idx, "problem", e.target.value)} placeholder="Problem..." /><input style={inputStyle} value={ch.solution} onChange={e => setChallenge(idx, "solution", e.target.value)} placeholder="Solution..." /></div>)}
            <button onClick={addChallenge} style={{ marginTop: 8, background: "none", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 16px", color: "#666", fontSize: 12, cursor: "pointer", width: "100%", fontFamily: F }}>+ Add Challenge</button>
          </div>
          <div><label style={labelStyle}>GitHub / Source Link (optional)</label><input style={inputStyle} value={form.github} onChange={e => set("github", e.target.value)} placeholder="https://github.com/..." /></div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "10px 24px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#aaa", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Cancel</button>
          <button onClick={handleSubmit} style={{ padding: "10px 28px", background: "#fff", border: "none", borderRadius: 10, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F, opacity: form.title.trim() ? 1 : 0.4 }}>{initial ? "Save Changes" : "Add Project"}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ project, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 24px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f5f5f7", marginBottom: 8 }}>Delete Project</h3>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6 }}>Delete <strong style={{ color: "#ccc" }}>{project.title}</strong>? This cannot be undone.</p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
          <button onClick={onCancel} style={{ padding: "9px 24px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#aaa", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "9px 24px", background: "#ff453a", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick, index }) {
  const [ref, v] = useReveal(); const [h, setH] = useState(false);
  return (
    <div ref={ref} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(30px)", transition: "opacity 0.6s ease " + (index * 0.08) + "s, transform 0.6s ease " + (index * 0.08) + "s", cursor: "pointer", borderRadius: 14, overflow: "hidden", background: "#1c1c1e", border: h ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ position: "relative", overflow: "hidden", height: 210 }}>
        {project.thumbnail ? <img src={project.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: h ? "scale(1.05)" : "scale(1)", transition: "transform 0.5s ease", filter: "brightness(0.85)" }} /> : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 40, opacity: 0.12 }}>&#9881;</span></div>}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 50%, rgba(0,0,0,0.5))" }} />
        <div style={{ position: "absolute", top: 12, left: 12 }}><span style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, color: "#ddd", border: "1px solid rgba(255,255,255,0.08)" }}>{project.category}</span></div>
        {(project.videoUrl || project.media?.length > 0) && <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 6 }}>
          {project.videoUrl && <span style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)" }}>VIDEO</span>}
          {project.media?.length > 0 && <span style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#fff", fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)" }}>{project.media.length} PHOTOS</span>}
        </div>}
      </div>
      <div style={{ padding: "18px 20px 22px" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#eee", margin: 0, lineHeight: 1.3 }}>{project.title}</h3>
        <p style={{ fontSize: 13.5, color: "#777", lineHeight: 1.6, marginTop: 8 }}>{project.summary}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14 }}>
          {(project.techStack || []).slice(0, 3).map(t => <span key={t} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#777", padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 500 }}>{t}</span>)}
          {(project.techStack || []).length > 3 && <span style={{ background: "rgba(255,255,255,0.03)", color: "#555", padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 500 }}>+{project.techStack.length - 3}</span>}
        </div>
      </div>
    </div>
  );
}

function AddProjectCard({ onClick }) {
  const [h, setH] = useState(false);
  return <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ cursor: "pointer", borderRadius: 14, border: "2px dashed rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, transition: "all 0.25s", background: h ? "rgba(255,255,255,0.04)" : "transparent" }}><div style={{ width: 52, height: 52, borderRadius: "50%", background: h ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: h ? "#fff" : "#555" }}>+</div><span style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: h ? "#ccc" : "#555" }}>Add Project</span></div>;
}

function EmptyState({ onAdd, isAdmin }) {
  return <div style={{ textAlign: "center", padding: "60px 24px" }}><div style={{ fontSize: 48, opacity: 0.1, marginBottom: 16 }}>&#9881;</div><h3 style={{ fontSize: 20, fontWeight: 600, color: "#555", marginBottom: 8 }}>{isAdmin ? "No projects yet" : "Projects coming soon"}</h3>{isAdmin && <><p style={{ fontSize: 14, color: "#444", marginBottom: 24 }}>Add your first project to get started.</p><button onClick={onAdd} style={{ padding: "12px 28px", background: "#fff", border: "none", borderRadius: 10, color: "#000", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: F }}>+ Add First Project</button></>}</div>;
}

/* ══════════════ NAV & SOCIAL ══════════════ */
function NavButton({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: "none", border: "none", fontSize: 13, fontWeight: active ? 600 : 500, color: (active || hovered) ? "#f5f5f7" : "#888", cursor: "pointer", fontFamily: F, padding: "0 0 2px 0", borderBottom: active ? "1.5px solid rgba(255,255,255,0.5)" : "1.5px solid transparent", transition: "all 0.25s ease" }}>{label}</button>;
}

function SocialLink({ href, label, children }) {
  const [h, setH] = useState(false);
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 28, background: h ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: h ? "#fff" : "#aaa", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "all 0.25s ease" }}>{children}{label}</a>;
}

const LinkedInIcon = (s) => <svg width={s||16} height={s||16} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
const GitHubIcon = (s) => <svg width={s||16} height={s||16} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>;
const EmailIcon = (s) => <svg width={s||16} height={s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>;
const DownloadIcon = (s) => <svg width={s||16} height={s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const GearIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;

/* ════════════════════ MAIN ════════════════════ */
export default function Portfolio() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const clickTimesRef = useRef([]);

  // Triple-click "IA" logo to toggle admin mode
  const handleLogoClick = () => {
    const now = Date.now();
    clickTimesRef.current = [...clickTimesRef.current.filter(t => now - t < 800), now];
    if (clickTimesRef.current.length >= 3) {
      setIsAdmin(prev => !prev);
      clickTimesRef.current = [];
    }
  };

  // Also support ?admin URL param
  useEffect(() => {
    if (window.location.search.includes("admin")) setIsAdmin(true);
  }, []);

  useEffect(() => {
    (async () => {
      const [storedPr, storedP, storedS] = await Promise.all([loadData("portfolio-profile"), loadData("portfolio-projects-v2"), loadData("portfolio-skills")]);
      if (storedPr) setProfile(prev => ({ ...prev, ...storedPr }));
      setProjects(storedP && storedP.length > 0 ? storedP : DATA_PROJECTS);
      setSkills(storedS?.length > 0 ? storedS : DEFAULT_SKILLS);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { const h = () => setScrolled(window.scrollY > 40); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);

  useEffect(() => {
    const sectionIds = ["projects", "skills", "about", "contact"];
    const handleScroll = () => {
      const offset = 120; let current = "";
      for (const id of sectionIds) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= offset) current = id; }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [projects.length, skills.length]);

  const persistProfile = useCallback(async (u) => { setProfile(u); await saveData("portfolio-profile", u); }, []);
  const persistProjects = useCallback(async (u) => { setProjects(u); await saveData("portfolio-projects-v2", u); }, []);
  const persistSkills = useCallback(async (u) => { setSkills(u); await saveData("portfolio-skills", u); }, []);

  const handleAdd = p => { persistProjects([p, ...projects]); setShowForm(false); };
  const handleEdit = p => { persistProjects(projects.map(x => x.id === p.id ? p : x)); setEditTarget(null); setSelected(null); };
  const handleDelete = () => { persistProjects(projects.filter(p => p.id !== deleteTarget.id)); setDeleteTarget(null); setSelected(null); };
  const moveProject = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= projects.length) return;
    const arr = [...projects];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    persistProjects(arr);
  };
  const [reordering, setReordering] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const categories = ["All", ...new Set(projects.map(p => p.category))];
  const filtered = filter === "All" ? projects : projects.filter(p => p.category === filter);
  const initials = (profile.firstName?.[0] || "") + (profile.lastName?.[0] || "");

  if (loading) return <div style={{ fontFamily: F, background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#555", fontSize: 15 }}>Loading...</div></div>;

  return (
    <div style={{ fontFamily: F, background: "#0a0a0a", minHeight: "100vh", color: "#f5f5f7", position: "relative", overflow: "hidden" }}>
      <style>{"\
        * { margin: 0; padding: 0; box-sizing: border-box; }\
        html { scroll-behavior: smooth; }\
        @keyframes modalIn { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }\
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }\
        @keyframes lineDraw { from { width: 0; } to { width: 60px; } }\
        ::selection { background: rgba(255,255,255,0.2); color: #fff; }\
        @media (max-width: 640px) { .nav-links { display: none !important; } .nav-burger { display: flex !important; } }\
        @media (min-width: 641px) { .nav-burger { display: none !important; } .mobile-menu { display: none !important; } }\
      "}</style>
      <GridBG />

      {/* Admin indicator */}
      {isAdmin && <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 200, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, padding: "6px 14px", fontSize: 11, color: "#3b82f6", fontWeight: 600, backdropFilter: "blur(8px)" }}>Admin Mode</div>}

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(10,10,10,0.8)" : "transparent", backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "all 0.3s ease", padding: "0 32px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={handleLogoClick} style={{ fontSize: 15, fontWeight: 600, color: "#f5f5f7", letterSpacing: -0.3, cursor: "pointer", userSelect: "none" }}>{initials}</span>
        <div className="nav-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {["Projects", "Skills", "About", "Contact"].filter(item => {
            if (item === "Skills" && skills.length === 0 && !isAdmin) return false;
            return true;
          }).map(item => (
            <NavButton key={item} label={item} active={activeSection === item.toLowerCase()} onClick={() => { const el = document.getElementById(item.toLowerCase()); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
          ))}
          {isAdmin && <button onClick={() => setShowSettings(true)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4, display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#666"}><GearIcon /></button>}
        </div>
        <button className="nav-burger" onClick={() => setMobileMenu(!mobileMenu)} style={{ display: "none", background: "none", border: "none", color: "#f5f5f7", cursor: "pointer", padding: 4, flexDirection: "column", gap: 4 }}>
          <span style={{ width: 20, height: 2, background: "#f5f5f7", borderRadius: 1, transition: "all 0.2s", transform: mobileMenu ? "rotate(45deg) translateY(6px)" : "none" }} />
          <span style={{ width: 20, height: 2, background: "#f5f5f7", borderRadius: 1, transition: "all 0.2s", opacity: mobileMenu ? 0 : 1 }} />
          <span style={{ width: 20, height: 2, background: "#f5f5f7", borderRadius: 1, transition: "all 0.2s", transform: mobileMenu ? "rotate(-45deg) translateY(-6px)" : "none" }} />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenu && <div className="mobile-menu" style={{ position: "fixed", top: 52, left: 0, right: 0, bottom: 0, zIndex: 99, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
        {["Projects", "Skills", "About", "Contact"].filter(item => {
            if (item === "Skills" && skills.length === 0 && !isAdmin) return false;
            return true;
          }).map(item => (
          <button key={item} onClick={() => { setMobileMenu(false); setTimeout(() => { const el = document.getElementById(item.toLowerCase()); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100); }}
            style={{ background: "none", border: "none", fontSize: 24, fontWeight: 600, color: activeSection === item.toLowerCase() ? "#f5f5f7" : "#888", cursor: "pointer", fontFamily: F, transition: "color 0.2s" }}>{item}</button>
        ))}
        {isAdmin && <button onClick={() => { setMobileMenu(false); setShowSettings(true); }} style={{ background: "none", border: "none", fontSize: 16, color: "#666", cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 8 }}><GearIcon /> Settings</button>}
      </div>}

      {/* Hero */}
      <section style={{ position: "relative", paddingTop: 140, paddingBottom: 60, textAlign: "center", maxWidth: 820, margin: "0 auto", padding: "140px 24px 60px" }}>
        <GlowOrb top="-200px" left="-150px" color="#3b82f6" size={600} />
        <GlowOrb top="-100px" left="60%" color="#8b5cf6" size={500} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#555", letterSpacing: 3, textTransform: "uppercase", animation: "fadeUp 0.6s ease", marginBottom: 20 }}>{profile.tagline}</p>
          <h1 style={{ fontSize: "clamp(52px, 9vw, 88px)", fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.03em", animation: "fadeUp 0.6s ease 0.1s", animationFillMode: "both" }}>{profile.firstName}</h1>
          <h1 style={{ fontSize: "clamp(52px, 9vw, 88px)", fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.03em", animation: "fadeUp 0.6s ease 0.15s", animationFillMode: "both", marginTop: 4 }}>{profile.lastName}</h1>
          <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", margin: "24px auto 0", borderRadius: 2, animation: "lineDraw 0.8s ease 0.4s both" }} />
          <p style={{ fontSize: 17, color: "#777", marginTop: 24, lineHeight: 1.7, maxWidth: 520, margin: "24px auto 0", animation: "fadeUp 0.6s ease 0.25s", animationFillMode: "both" }}>{profile.bio}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 36, flexWrap: "wrap", animation: "fadeUp 0.6s ease 0.35s", animationFillMode: "both" }}>
            <SocialLink href={profile.linkedin} label="LinkedIn">{LinkedInIcon()}</SocialLink>
            <SocialLink href={profile.email ? "mailto:" + profile.email : ""} label="Email">{EmailIcon()}</SocialLink>
            {profile.github && <SocialLink href={profile.github} label="GitHub">{GitHubIcon()}</SocialLink>}
            {profile.cvUrl && (
              isDataUrl(profile.cvUrl) ? (
                <a href={profile.cvUrl} download="Idan_Avioz_CV.pdf" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 28, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "all 0.25s ease", cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#aaa"; }}>{DownloadIcon()}Download CV</a>
              ) : <SocialLink href={profile.cvUrl} label="Download CV">{DownloadIcon()}</SocialLink>
            )}
          </div>
        </div>
      </section>

      {/* Stats — hidden until you have content */}
      {(projects.length > 0 || skills.length > 0) && <section style={{ maxWidth: 680, margin: "0 auto 72px", display: "flex", justifyContent: "center", gap: 56, padding: "0 24px", flexWrap: "wrap" }}>
        {[{ num: projects.length, label: "Projects Built" }, { num: skills.length, label: "Skills" }, { num: projects.length > 0 ? new Set(projects.map(p => p.category)).size : 0, label: "Domains" }].map(s => s.num > 0 && <div key={s.label} style={{ textAlign: "center" }}><div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.num}</div><div style={{ fontSize: 13, color: "#555", marginTop: 4, fontWeight: 500 }}>{s.label}</div></div>)}
      </section>}

      {/* Projects */}
      <section id="projects" style={{ scrollMarginTop: 64, maxWidth: 1080, margin: "0 auto", padding: "0 24px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          {projects.length > 0 && categories.length > 2 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{categories.map(c => <button key={c} onClick={() => setFilter(c)} style={pillBtn(filter === c)}>{c}</button>)}</div>}
          {isAdmin && projects.length > 1 && (
            <button onClick={() => setReordering(!reordering)} style={{ padding: "7px 18px", borderRadius: 20, background: reordering ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)", border: reordering ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.1)", color: reordering ? "#3b82f6" : "#888", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: F, transition: "all 0.2s" }}>
              {reordering ? "Done Reordering" : "Reorder"}
            </button>
          )}
        </div>
        {projects.length === 0 ? <EmptyState onAdd={() => setShowForm(true)} isAdmin={isAdmin} /> : reordering ? (
          /* Reorder mode — list view with arrows */
          <div style={{ display: "grid", gap: 8, maxWidth: 600, margin: "0 auto" }}>
            {projects.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 16px" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#555", width: 24, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                <div style={{ width: 48, height: 34, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#111" }}>
                  {p.thumbnail ? <img src={p.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "#1a1a2e" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#eee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{p.category}</div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => moveProject(i, -1)} disabled={i === 0} style={{ width: 30, height: 30, borderRadius: 6, background: i === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: i === 0 ? "#333" : "#aaa", fontSize: 14, cursor: i === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&#8593;</button>
                  <button onClick={() => moveProject(i, 1)} disabled={i === projects.length - 1} style={{ width: 30, height: 30, borderRadius: 6, background: i === projects.length - 1 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: i === projects.length - 1 ? "#333" : "#aaa", fontSize: 14, cursor: i === projects.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&#8595;</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {filtered.map((p, i) => <ProjectCard key={p.id} project={p} index={i} onClick={() => setSelected(p)} />)}
            {isAdmin && <AddProjectCard onClick={() => { setEditTarget(null); setShowForm(true); }} />}
          </div>
        )}</section>

      <SkillsSection skills={skills} onUpdate={persistSkills} isAdmin={isAdmin} />

      {/* About */}
      <section id="about" style={{ scrollMarginTop: 64, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "80px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>About Me</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#888", marginTop: 20 }}>{profile.aboutText}</p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ scrollMarginTop: 64, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "56px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Let's Connect</h2>
        <p style={{ color: "#555", fontSize: 14, marginTop: 10 }}>Open to collaborations, internships, and interesting projects.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          <SocialLink href={profile.email ? "mailto:" + profile.email : ""} label="Email">{EmailIcon(14)}</SocialLink>
          <SocialLink href={profile.linkedin} label="LinkedIn">{LinkedInIcon(14)}</SocialLink>
          {profile.github && <SocialLink href={profile.github} label="GitHub">{GitHubIcon(14)}</SocialLink>}
        </div>
        <p style={{ color: "#333", fontSize: 12, marginTop: 48 }}>2026 {profile.firstName} {profile.lastName}. Built with passion.</p>
      </section>

      {/* Modals */}
      {selected && !editTarget && !deleteTarget && <ProjectModal project={selected} onClose={() => setSelected(null)} onEdit={() => setEditTarget(selected)} onDelete={() => setDeleteTarget(selected)} isAdmin={isAdmin} />}
      {(showForm || editTarget) && <ProjectForm initial={editTarget || null} onSave={editTarget ? handleEdit : handleAdd} onCancel={() => { setShowForm(false); setEditTarget(null); }} />}
      {deleteTarget && <DeleteConfirm project={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {showSettings && <ProfileSettings profile={profile} onSave={persistProfile} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
