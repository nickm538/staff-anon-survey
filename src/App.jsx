import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const PFXKEY = "ws_v1_";
const FBKEY  = "wsfb_v1_";
const FB_MAX = 600;

const CATS = [
  {
    id: "wellness", label: "Wellness", icon: "🌿", color: "#10b981", bg: "#f0fdf4",
    desc: "Physical health, energy & work-life balance",
    qs: [
      { id: "w1", t: "How would you rate your overall physical wellbeing this week?", lo: "Very poor", hi: "Excellent" },
      { id: "w2", t: "How well are you sleeping lately?", lo: "Very poorly", hi: "Very well" },
      { id: "w3", t: "How energized do you feel during the workday?", lo: "Constantly drained", hi: "Full of energy" },
      { id: "w4", t: "How well are you managing your work-life balance?", lo: "Very poorly", hi: "Excellent" },
      { id: "w5", t: "Are you able to take meaningful breaks during the workday?", lo: "Never", hi: "Always" },
    ]
  },
  {
    id: "happiness", label: "Happiness", icon: "😊", color: "#f59e0b", bg: "#fefce8",
    desc: "Job satisfaction, team connection & sense of purpose",
    qs: [
      { id: "h1", t: "How satisfied are you with your work overall?", lo: "Very dissatisfied", hi: "Very satisfied" },
      { id: "h2", t: "How connected do you feel to your colleagues?", lo: "Isolated", hi: "Very connected" },
      { id: "h3", t: "Do you feel genuinely recognized for your contributions?", lo: "Not at all", hi: "Absolutely" },
      { id: "h4", t: "How meaningful does your work feel to you?", lo: "Not meaningful", hi: "Highly meaningful" },
      { id: "h5", t: "How optimistic are you about your future at this organization?", lo: "Not at all", hi: "Very optimistic" },
    ]
  },
  {
    id: "stress", label: "Stress", icon: "⚡", color: "#ef4444", bg: "#fef2f2",
    desc: "Workload manageability, pressure & ability to recover",
    qs: [
      { id: "s1", t: "How manageable is your current workload?", lo: "Completely overwhelming", hi: "Very manageable" },
      { id: "s2", t: "How often are you able to fully decompress after work?", lo: "Never", hi: "Always" },
      { id: "s3", t: "How often do you feel anxious or overwhelmed at work?", lo: "Almost constantly", hi: "Rarely / Never" },
      { id: "s4", t: "How supported do you feel by your manager or leadership?", lo: "Not supported", hi: "Very supported" },
      { id: "s5", t: "How sustainable is your current pace of work long-term?", lo: "Not at all", hi: "Very sustainable" },
    ]
  },
  {
    id: "satisfaction", label: "Org. Satisfaction", icon: "🏢", color: "#6366f1", bg: "#eef2ff",
    desc: "Leadership, communication & organizational trust",
    qs: [
      { id: "o1", t: "How satisfied are you with organizational processes and systems?", lo: "Very dissatisfied", hi: "Very satisfied" },
      { id: "o2", t: "How well does leadership communicate decisions that affect you?", lo: "Very poorly", hi: "Excellently" },
      { id: "o3", t: "How satisfied are you with your growth opportunities here?", lo: "Very dissatisfied", hi: "Very satisfied" },
      { id: "o4", t: "How often do you feel your concerns are genuinely heard?", lo: "Never", hi: "Always" },
      { id: "o5", t: "How likely are you to recommend this as a great place to work?", lo: "Not at all likely", hi: "Extremely likely" },
    ]
  },
  {
    id: "realtalk", label: "Real Talk", icon: "🎯", color: "#0f766e", bg: "#f0fdfa",
    desc: "Psychological safety, fairness & organizational integrity",
    qs: [
      { id: "rt1", t: "How safe do you feel raising concerns or disagreements — even with leadership — without fear of being sidelined, ignored, or penalized?", lo: "Not safe at all", hi: "Completely safe" },
      { id: "rt2", t: "How well do this organization's stated values and commitments match what you actually experience on the ground, day-to-day?", lo: "They don't match at all", hi: "Fully aligned" },
      { id: "rt3", t: "If you were genuinely struggling — overwhelmed, burning out, or in personal crisis — how confident are you that this organization would respond with real, meaningful support?", lo: "Not confident at all", hi: "Very confident" },
      { id: "rt4", t: "How fairly are workloads, advancement opportunities, and recognition distributed across your team or department?", lo: "Very unfairly", hi: "Very fairly" },
      { id: "rt5", t: "Setting aside politeness — if a trusted friend asked you honestly whether to take a job here, what would your gut answer be?", lo: "I'd warn them off", hi: "I'd strongly recommend it" },
    ]
  }
];

const SENT_CFG = {
  concern:    { label: "Concern",    color: "#ef4444", bg: "#fef2f2", icon: "⚠️" },
  question:   { label: "Question",   color: "#3b82f6", bg: "#eff6ff", icon: "❓" },
  suggestion: { label: "Suggestion", color: "#10b981", bg: "#f0fdf4", icon: "💡" },
  positive:   { label: "Positive",   color: "#f59e0b", bg: "#fefce8", icon: "⭐" },
};

/* ── Gauge ── */
function xyAt(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function mkArc(cx, cy, r, s, e) {
  if (Math.abs(e - s) < 0.5) return "";
  const p1 = xyAt(cx, cy, r, s), p2 = xyAt(cx, cy, r, e);
  return `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} A${r},${r} 0 ${(e-s)%360>180?1:0},1 ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
}
function Gauge({ score = 0, color = "#6b7280", size = 130 }) {
  const r = size * 0.36, cx = size / 2, cy = size * 0.52, sw = size * 0.095;
  const s = Math.min(Math.max(score, 0), 100);
  return (
    <svg width={size} height={size * 0.8} style={{ overflow: "visible", display: "block" }}>
      <path d={mkArc(cx, cy, r, 135, 405)} fill="none" stroke="#e5e7eb" strokeWidth={sw} strokeLinecap="round" />
      {s > 0.5 && <path d={mkArc(cx, cy, r, 135, 135 + (s/100)*270)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />}
      <text x={cx} y={cy+7} textAnchor="middle" fontSize={size*.22} fontWeight="800" fill="#1f2937" fontFamily="system-ui">{Math.round(s)}</text>
      <text x={cx} y={cy+size*.22} textAnchor="middle" fontSize={size*.095} fill="#9ca3af" fontFamily="system-ui">/100</text>
    </svg>
  );
}
function MiniBar({ value, color }) {
  return (
    <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width .5s ease" }} />
    </div>
  );
}
const sc = s => s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : s >= 35 ? "#f97316" : "#ef4444";
const sl = s => s >= 80 ? "Excellent" : s >= 65 ? "Good" : s >= 50 ? "Fair" : s >= 35 ? "Needs Attention" : "Critical";
function avgArr(arr, key) {
  const v = arr.filter(x => x[key] != null).map(x => x[key]);
  return v.length ? Math.round(v.reduce((a,b) => a+b, 0) / v.length) : 0;
}

/* ── AI Feedback Analysis ── */
function FeedbackAnalysis({ feedbacks }) {
  const [themes, setThemes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const ran = useRef(false);

  useEffect(() => {
    if (feedbacks.length >= 2 && !ran.current) { ran.current = true; analyze(); }
  }, []);

  async function analyze() {
    setLoading(true); setErr(null);
    try {
      const texts = feedbacks.map((f, i) => `[${i+1}] ${f.text}`).join("\n\n");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: `You are an HR analytics specialist helping an organization understand anonymous employee feedback. Analyze the submissions and identify the top recurring themes, concerns, questions, and suggestions across all responses. Return ONLY a valid JSON array — no markdown, no code blocks, no preamble, nothing else. Each object must have exactly: "rank" (integer, starts at 1), "theme" (string, 3-6 word descriptive title), "count" (integer, number of submissions referencing this theme), "summary" (string, 2-3 sentences describing the common thread in employees' own voice), "sentiment" (one of exactly: "concern", "question", "suggestion", "positive"). Sort descending by count. Maximum 7 themes. If fewer than 2 valid submissions exist return [].`,
          messages: [{ role: "user", content: `Analyze these ${feedbacks.length} anonymous employee feedback submissions and identify top themes:\n\n${texts}` }]
        })
      });
      const data = await res.json();
      const txt = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
      const parsed = JSON.parse(txt.replace(/```(?:json)?|```/g,"").trim());
      setThemes(Array.isArray(parsed) ? parsed : []);
    } catch { setErr("Analysis could not be completed. Please try refreshing."); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, color: "#1f2937", fontSize: 14 }}>🧠 AI Feedback Intelligence</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {feedbacks.length} anonymous response{feedbacks.length !== 1 ? "s" : ""} · themes auto-ranked by AI
          </div>
        </div>
        {(themes !== null || err) && !loading && (
          <button onClick={analyze} style={{ padding: "6px 12px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, cursor: "pointer", color: "#374151" }}>
            ↺ Refresh
          </button>
        )}
      </div>

      {feedbacks.length < 2 && (
        <div style={{ textAlign: "center", padding: "28px 16px", color: "#9ca3af", fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Analysis will appear soon</div>
          At least 2 feedback submissions are needed to begin surfacing common themes. Results may take some time to populate as more staff respond — check back after more submissions come in.
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "28px 16px", color: "#6b7280", fontSize: 13 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🧠</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Analyzing {feedbacks.length} submissions…</div>
          Grouping common themes and ranking by frequency. This may take a moment.
        </div>
      )}

      {err && !loading && (
        <div style={{ background: "#fef2f2", border: "1px solid #ef444430", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#ef4444" }}>
          ⚠️ {err}
        </div>
      )}

      {themes && !loading && themes.length === 0 && (
        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "16px" }}>
          No clear themes identified yet. More responses will improve the analysis.
        </div>
      )}

      {themes && !loading && themes.length > 0 && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {themes.map(th => {
              const cfg = SENT_CFG[th.sentiment] || SENT_CFG.concern;
              return (
                <div key={th.rank} style={{ border: `1px solid ${cfg.color}30`, borderRadius: 10, background: cfg.bg, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ minWidth: 34, height: 34, borderRadius: 8, background: cfg.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                      #{th.rank}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: "#1f2937", fontSize: 14 }}>{th.theme}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: "white", padding: "2px 9px", borderRadius: 20, border: `1px solid ${cfg.color}40`, whiteSpace: "nowrap" }}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>~{th.count} resp.</span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#4b5563", lineHeight: 1.65 }}>{th.summary}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "#d1d5db", marginTop: 12 }}>
            AI-generated · individual responses remain fully anonymous
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const [screen,       setScreen]       = useState("welcome");
  const [sec,          setSec]          = useState(0);
  const [ans,          setAns]          = useState({});
  const [feedback,     setFeedback]     = useState("");
  const [myS,          setMyS]          = useState(null);
  const [subs,         setSubs]         = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [ready,        setReady]        = useState(false);
  const [busy,         setBusy]         = useState(false);
  const [anim,         setAnim]         = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [sr, fr] = await Promise.all([
        window.storage.list(PFXKEY),
        window.storage.list(FBKEY),
      ]);
      if (sr?.keys?.length) {
        const rows = await Promise.all(sr.keys.map(k => window.storage.get(k)));
        setSubs(rows.filter(x=>x?.value).map(x=>{try{return JSON.parse(x.value);}catch{return null;}}).filter(Boolean).sort((a,b)=>a.timestamp-b.timestamp));
      }
      if (fr?.keys?.length) {
        const frows = await Promise.all(fr.keys.map(k => window.storage.get(k)));
        setAllFeedbacks(frows.filter(x=>x?.value).map(x=>{try{return JSON.parse(x.value);}catch{return null;}}).filter(Boolean).sort((a,b)=>a.timestamp-b.timestamp));
      }
    } catch {}
    setReady(true);
  }

  function calcScore(a) {
    let tot = 0; const s = {};
    for (const c of CATS) {
      const m = c.qs.reduce((t,q) => t+(a[q.id]??3), 0) / c.qs.length;
      s[c.id] = Math.round((m/5)*100); tot += s[c.id];
    }
    s.overall = Math.round(tot/CATS.length);
    return s;
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    const s = calcScore(ans);
    setMyS(s);
    const now = new Date();
    const ts  = now.getTime();
    const rnd = Math.random().toString(36).slice(2,6);
    const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const entry = { timestamp: ts, date, ...s };
    try {
      await window.storage.set(`${PFXKEY}${ts}_${rnd}`, JSON.stringify(entry));
      setSubs(p => [...p, entry]);
    } catch {}
    if (feedback.trim()) {
      const fbEntry = { timestamp: ts, date, text: feedback.trim() };
      try {
        await window.storage.set(`${FBKEY}${ts}_${rnd}`, JSON.stringify(fbEntry));
        setAllFeedbacks(p => [...p, fbEntry]);
      } catch {}
    }
    const zeros = Object.fromEntries(Object.keys(s).map(k=>[k,0]));
    setAnim(zeros);
    let f = 0;
    const timer = setInterval(() => {
      f++;
      const prog = Math.min(f/55, 1), ease = 1-Math.pow(1-prog,3);
      setAnim(Object.fromEntries(Object.keys(s).map(k=>[k,s[k]*ease])));
      if (prog>=1) clearInterval(timer);
    }, 16);
    setBusy(false);
    setScreen("results");
  }

  const allQs   = CATS.flatMap(c => c.qs);
  const doneQ   = allQs.filter(q => ans[q.id] != null).length;
  const totalQ  = allQs.length;
  const disp    = anim ?? myS ?? {};
  const STEPS   = CATS.length + 1; // 5 question sections + 1 feedback step

  const cd = (() => {
    const g = {};
    for (const sub of subs) (g[sub.date] = g[sub.date]||[]).push(sub);
    return Object.entries(g).map(([d,arr]) => ({
      date: d, n: arr.length,
      Overall: avgArr(arr,"overall"), Wellness: avgArr(arr,"wellness"),
      Happiness: avgArr(arr,"happiness"), Stress: avgArr(arr,"stress"),
      "Org. Sat.": avgArr(arr,"satisfaction"),
    }));
  })();

  const teamAvg = subs.length ? {
    overall: avgArr(subs,"overall"), wellness: avgArr(subs,"wellness"),
    happiness: avgArr(subs,"happiness"), stress: avgArr(subs,"stress"),
    satisfaction: avgArr(subs,"satisfaction"),
  } : null;

  /* ── Loading ── */
  if (!ready) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui", background:"#f8fafc" }}>
      <div style={{ textAlign:"center", color:"#6b7280" }}>
        <div style={{ fontSize:40 }}>💙</div>
        <p style={{ marginTop:12, fontSize:14 }}>Loading wellness data…</p>
      </div>
    </div>
  );

  /* ── Welcome ── */
  if (screen === "welcome") return (
    <div style={S.page}><div style={S.wrap}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:52, marginBottom:10 }}>💙</div>
        <h1 style={S.h1}>Staff Wellness Pulse</h1>
        <p style={S.sub}>A comprehensive, anonymous benchmark tracking how our team is doing — across four key dimensions, over time.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {CATS.map(c => (
          <div key={c.id} style={{ ...S.card, background:c.bg, border:`1px solid ${c.color}30` }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontWeight:700, color:"#1f2937", fontSize:14 }}>{c.label}</div>
            <div style={{ color:"#6b7280", fontSize:11, marginTop:3, lineHeight:1.45 }}>{c.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, display:"flex", justifyContent:"space-around", marginBottom:18 }}>
        {[["📝","20 Questions"],["⏱️","~4 Minutes"],["🔒","Anonymous"],["💬","Open Feedback"]].map(([ic,lb]) => (
          <div key={lb} style={{ textAlign:"center" }}>
            <div style={{ fontSize:20 }}>{ic}</div>
            <div style={{ fontSize:10, color:"#6b7280", fontWeight:600, marginTop:4 }}>{lb}</div>
          </div>
        ))}
      </div>

      {teamAvg && (
        <div style={{ ...S.card, marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontWeight:700, color:"#1f2937", fontSize:14 }}>Team Average</span>
            <div style={{ textAlign:"right" }}>
              <span style={{ fontWeight:800, fontSize:24, color:sc(teamAvg.overall) }}>{teamAvg.overall}</span>
              <span style={{ fontSize:11, color:"#9ca3af" }}>/100</span>
              <div style={{ fontSize:10, color:"#9ca3af", marginTop:1 }}>{subs.length} submission{subs.length>1?"s":""}</div>
            </div>
          </div>
          {CATS.map(c => (
            <div key={c.id} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:"#374151" }}>{c.icon} {c.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:c.color }}>{teamAvg[c.id]}</span>
              </div>
              <MiniBar value={teamAvg[c.id]} color={c.color} />
            </div>
          ))}
        </div>
      )}

      <button onClick={() => { setAns({}); setFeedback(""); setSec(0); setScreen("survey"); }} style={{ ...S.btnP, marginBottom:10 }}>
        Take the Survey →
      </button>
      {subs.length > 0 && (
        <button onClick={() => setScreen("dashboard")} style={S.btnS}>
          📊 View Trend Dashboard ({subs.length} submission{subs.length>1?"s":""})
        </button>
      )}
      <p style={{ textAlign:"center", fontSize:11, color:"#d1d5db", marginTop:18 }}>
        Responses are anonymously pooled. No names are recorded.
      </p>
    </div></div>
  );

  /* ── Survey ── */
  if (screen === "survey") {
    const isFeedbackStep = sec === CATS.length;
    const cat = !isFeedbackStep ? CATS[sec] : null;
    const pct = (doneQ / totalQ) * 100;

    return (
      <div style={S.page}><div style={S.wrap}>
        {/* Progress */}
        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            {isFeedbackStep
              ? <span style={{ fontSize:13, fontWeight:700, color:"#8b5cf6" }}>💬 Step {STEPS}/{STEPS}: Open Feedback</span>
              : <span style={{ fontSize:13, fontWeight:700, color:cat.color }}>{cat.icon} Section {sec+1}/{STEPS}: {cat.label}</span>
            }
            <span style={{ fontSize:12, color:"#9ca3af" }}>{doneQ}/{totalQ} answered</span>
          </div>
          <div style={{ height:6, background:"#e5e7eb", borderRadius:10 }}>
            <div style={{ height:"100%", width:`${isFeedbackStep?100:pct}%`, background: isFeedbackStep?"#8b5cf6":cat.color, borderRadius:10, transition:"width .3s ease" }} />
          </div>
          {/* Section dots */}
          <div style={{ display:"flex", gap:6, marginTop:8 }}>
            {[...CATS.map((c,i) => ({ color:c.color, id:c.id, i })), { color:"#8b5cf6", id:"fb", i:CATS.length }].map(({ color, id, i }) => (
              <div key={id} onClick={() => setSec(i)}
                style={{ flex:1, height:3, borderRadius:2, cursor:"pointer",
                  background: i===sec ? color : i<sec ? "#d1d5db" : "#f3f4f6",
                  transition: "background .2s"
                }} />
            ))}
          </div>
        </div>

        {/* Question sections */}
        {!isFeedbackStep && (
          <>
            <div style={{ background:cat.bg, border:`1px solid ${cat.color}30`, borderRadius:10, padding:"12px 16px", marginBottom:18, display:"flex", gap:12, alignItems:"center" }}>
              <span style={{ fontSize:28 }}>{cat.icon}</span>
              <div>
                <div style={{ fontWeight:700, color:"#1f2937", fontSize:15 }}>{cat.label}</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>{cat.desc}</div>
              </div>
            </div>
            {cat.qs.map((q, qi) => (
              <div key={q.id} style={{ ...S.card, marginBottom:14, border:`1px solid ${ans[q.id]!=null?cat.color+"55":"#e5e7eb"}`, transition:"border-color .15s" }}>
                <p style={{ margin:"0 0 14px", fontSize:14, lineHeight:1.55, color:"#1f2937", fontWeight:500 }}>
                  <span style={{ color:cat.color, fontWeight:800, marginRight:5 }}>{qi+1}.</span>{q.t}
                </p>
                <div style={{ display:"flex", gap:6 }}>
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setAns(a => ({...a,[q.id]:v}))}
                      style={{ flex:1, height:44, border:`2px solid ${ans[q.id]===v?cat.color:"#e5e7eb"}`, borderRadius:8, background:ans[q.id]===v?cat.color:"white", color:ans[q.id]===v?"white":"#374151", fontWeight:700, fontSize:16, cursor:"pointer" }}
                    >{v}</button>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  <span style={{ fontSize:10, color:"#9ca3af" }}>1 — {q.lo}</span>
                  <span style={{ fontSize:10, color:"#9ca3af" }}>{q.hi} — 5</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Feedback step */}
        {isFeedbackStep && (
          <>
            <div style={{ background:"#f5f3ff", border:"1px solid #8b5cf630", borderRadius:10, padding:"14px 18px", marginBottom:18, display:"flex", gap:12, alignItems:"flex-start" }}>
              <span style={{ fontSize:28 }}>💬</span>
              <div>
                <div style={{ fontWeight:700, color:"#1f2937", fontSize:15 }}>Open Feedback</div>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:2, lineHeight:1.5 }}>
                  Optional and 100% anonymous. Share any questions, concerns, or suggestions. Responses are pooled with all staff feedback and analyzed by AI to surface common themes — no individual response is ever shown.
                </div>
              </div>
            </div>

            <div style={{ ...S.card, marginBottom:14 }}>
              <p style={{ margin:"0 0 12px", fontSize:14, fontWeight:600, color:"#1f2937" }}>
                Is there anything else on your mind? <span style={{ color:"#9ca3af", fontWeight:400 }}>(optional)</span>
              </p>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value.slice(0, FB_MAX))}
                placeholder="Share any questions, concerns, ideas, or general thoughts about your workplace experience…"
                style={{ width:"100%", minHeight:140, padding:"12px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:14, lineHeight:1.65, fontFamily:"system-ui, sans-serif", resize:"vertical", boxSizing:"border-box", outline:"none", color:"#1f2937" }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span style={{ fontSize:11, color:"#9ca3af" }}>Your response will only ever be seen in aggregate AI analysis — never individually.</span>
                <span style={{ fontSize:11, color: feedback.length > FB_MAX*0.9 ? "#f97316" : "#9ca3af" }}>{feedback.length}/{FB_MAX}</span>
              </div>
            </div>

            <div style={{ ...S.card, background:"#f9fafb", marginBottom:20 }}>
              <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.6 }}>
                ✅ <b>All 20 questions answered.</b> Click Submit below to record your responses.
                {feedback.trim() ? " Your feedback will also be anonymously included in the AI analysis." : " You can also add optional open feedback above."}
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => sec > 0 ? setSec(s=>s-1) : setScreen("welcome")} style={{ flex:1, ...S.btnS, width:"auto" }}>
            {sec > 0 ? "← Back" : "✕ Cancel"}
          </button>
          {sec < CATS.length ? (
            <button onClick={() => setSec(s=>s+1)} style={{ flex:2, ...S.btnP, width:"auto", background: cat.color }}>
              Next Section →
            </button>
          ) : (
            <button onClick={submit} disabled={busy || doneQ < totalQ}
              style={{ flex:2, ...S.btnP, width:"auto", background: doneQ===totalQ&&!busy?"#1d4ed8":"#9ca3af", cursor: doneQ===totalQ&&!busy?"pointer":"not-allowed" }}
            >
              {busy ? "Submitting…" : "Submit Survey ✓"}
            </button>
          )}
        </div>
        {isFeedbackStep && doneQ < totalQ && (
          <p style={{ color:"#ef4444", fontSize:12, textAlign:"center", marginTop:8 }}>
            {totalQ - doneQ} unanswered question{totalQ-doneQ>1?"s":""} — use the dots above to go back and complete all sections first.
          </p>
        )}
      </div></div>
    );
  }

  /* ── Results ── */
  if (screen === "results" && myS) return (
    <div style={S.page}><div style={S.wrap}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:40 }}>🎉</div>
        <h2 style={{ ...S.h1, fontSize:22, marginTop:8 }}>Survey Complete!</h2>
        <p style={{ ...S.sub, marginTop:4 }}>Your anonymous response has been recorded. Here's your personal snapshot.</p>
      </div>

      <div style={{ ...S.card, textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>Overall Pulse Score</div>
        <div style={{ display:"flex", justifyContent:"center" }}>
          <Gauge score={disp.overall??0} color={sc(myS.overall)} size={180} />
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:sc(myS.overall), marginTop:6 }}>{sl(myS.overall)}</div>
        {teamAvg && <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>Team average: {teamAvg.overall}/100</div>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        {CATS.map(c => (
          <div key={c.id} style={{ ...S.card, textAlign:"center" }}>
            <div style={{ fontSize:22 }}>{c.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#374151", margin:"4px 0 8px" }}>{c.label}</div>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <Gauge score={disp[c.id]??0} color={c.color} size={110} />
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:sc(myS[c.id]), marginTop:6 }}>{sl(myS[c.id])}</div>
            {teamAvg && <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>Team avg: {teamAvg[c.id]}</div>}
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:14 }}>Score Breakdown</div>
        {CATS.map(c => (
          <div key={c.id} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:13, color:"#374151" }}>{c.icon} {c.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:c.color }}>{myS[c.id]}/100</span>
            </div>
            <div style={{ height:8, background:"#f3f4f6", borderRadius:4 }}>
              <div style={{ height:"100%", width:`${disp[c.id]??0}%`, background:c.color, borderRadius:4 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Score Reference</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
          {[["#10b981","80–100","Excellent"],["#84cc16","65–79","Good"],["#f59e0b","50–64","Fair"],["#f97316","35–49","Needs Attention"],["#ef4444","0–34","Critical"]].map(([col,r,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:9, height:9, borderRadius:"50%", background:col }} />
              <span style={{ fontSize:11, color:"#6b7280" }}><b>{l}</b> <span style={{ color:"#9ca3af" }}>({r})</span></span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => setScreen("dashboard")} style={{ flex:1, ...S.btnP, width:"auto" }}>📊 Team Trends</button>
        <button onClick={() => { setAns({}); setFeedback(""); setSec(0); setScreen("survey"); }} style={{ flex:1, ...S.btnS, width:"auto" }}>Retake</button>
      </div>
    </div></div>
  );

  /* ── Dashboard ── */
  if (screen === "dashboard") return (
    <div style={S.page}><div style={{ ...S.wrap, maxWidth:800 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div>
          <h2 style={S.h1}>📊 Wellness Dashboard</h2>
          <p style={{ ...S.sub, marginTop:4 }}>{subs.length} submission{subs.length!==1?"s":""} · anonymously aggregated across all staff</p>
        </div>
        <button onClick={() => setScreen("welcome")} style={{ ...S.btnS, width:"auto", padding:"7px 14px", fontSize:13 }}>← Back</button>
      </div>

      {/* Score cards */}
      {teamAvg ? (
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${CATS.length+1}, 1fr)`, gap:10, marginBottom:20 }}>
          {[{ id:"overall", label:"Overall", icon:"💙" }, ...CATS].map(c => {
            const val = c.id==="overall" ? teamAvg.overall : teamAvg[c.id];
            return (
              <div key={c.id} style={{ ...S.card, textAlign:"center", padding:"14px 8px" }}>
                <div style={{ fontSize:20 }}>{c.icon}</div>
                <div style={{ fontSize:24, fontWeight:800, color:sc(val), margin:"4px 0 2px", lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:10, color:"#9ca3af", lineHeight:1.3 }}>{c.label}</div>
                <div style={{ fontSize:10, fontWeight:700, color:sc(val), marginTop:5 }}>{sl(val)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ ...S.card, textAlign:"center", color:"#9ca3af", padding:"32px", marginBottom:20 }}>
          No submissions yet — take the survey to start tracking!
        </div>
      )}

      {/* Trend chart */}
      <div style={{ ...S.card, marginBottom:18 }}>
        <div style={{ fontWeight:700, color:"#1f2937", fontSize:14, marginBottom:16 }}>Score Trends Over Time</div>
        {cd.length >= 2 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cd} margin={{ top:5, right:10, left:-24, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:"#9ca3af" }} />
              <YAxis domain={[0,100]} tick={{ fontSize:11, fill:"#9ca3af" }} />
              <Tooltip
                contentStyle={{ fontSize:12, borderRadius:8, border:"1px solid #e5e7eb", boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}
                labelFormatter={(lbl, p) => `${lbl} · ${p?.[0]?.payload?.n??0} response${(p?.[0]?.payload?.n??0)!==1?"s":""}`}
              />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <Line type="monotone" dataKey="Overall"     stroke="#2563eb" strokeWidth={2.5} dot={{ r:4, fill:"#2563eb" }} activeDot={{ r:7 }} />
              <Line type="monotone" dataKey="Wellness"    stroke="#10b981" strokeWidth={1.5} dot={{ r:3 }} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="Happiness"   stroke="#f59e0b" strokeWidth={1.5} dot={{ r:3 }} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="Stress"      stroke="#ef4444" strokeWidth={1.5} dot={{ r:3 }} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="Org. Sat."   stroke="#6366f1" strokeWidth={1.5} dot={{ r:3 }} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height:180, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#9ca3af", fontSize:13, textAlign:"center", gap:8 }}>
            <div style={{ fontSize:32 }}>📈</div>
            Submit surveys on at least two different dates to see trend lines.
          </div>
        )}
      </div>

      {/* Category averages bar */}
      {teamAvg && (
        <div style={{ ...S.card, marginBottom:18 }}>
          <div style={{ fontWeight:700, color:"#1f2937", fontSize:14, marginBottom:14 }}>Category Averages — All Time</div>
          {CATS.map(c => (
            <div key={c.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:13, color:"#374151" }}>{c.icon} {c.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:c.color }}>{teamAvg[c.id]}/100 — {sl(teamAvg[c.id])}</span>
              </div>
              <MiniBar value={teamAvg[c.id]} color={c.color} />
            </div>
          ))}
        </div>
      )}

      {/* AI Feedback Analysis */}
      <div style={{ ...S.card, marginBottom:18 }}>
        <FeedbackAnalysis feedbacks={allFeedbacks} />
      </div>

      {/* History table */}
      {subs.length > 0 && (
        <div style={{ ...S.card, marginBottom:18, overflowX:"auto" }}>
          <div style={{ fontWeight:700, color:"#1f2937", fontSize:14, marginBottom:12 }}>All Submissions (newest first)</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>
                {["Date","Overall",...CATS.map(c=>c.icon+" "+c.label)].map(h => (
                  <th key={h} style={{ padding:"7px 10px", textAlign:"center", color:"#9ca3af", fontWeight:600, borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap", fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...subs].reverse().map((s,i) => (
                <tr key={i} style={{ borderBottom:"1px solid #f9fafb" }}>
                  <td style={{ padding:"6px 10px", color:"#6b7280", whiteSpace:"nowrap" }}>{s.date}</td>
                  <td style={{ padding:"6px 10px", textAlign:"center", fontWeight:800, color:sc(s.overall) }}>{s.overall}</td>
                  {CATS.map(c => (
                    <td key={c.id} style={{ padding:"6px 10px", textAlign:"center", fontWeight:600, color:sc(s[c.id]) }}>{s[c.id]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={() => { setAns({}); setFeedback(""); setSec(0); setScreen("survey"); }} style={S.btnP}>
        + Take New Survey
      </button>
    </div></div>
  );

  return null;
}

const S = {
  page: { minHeight:"100vh", background:"#f8fafc", fontFamily:"system-ui, -apple-system, 'Segoe UI', sans-serif", padding:"20px 16px" },
  wrap: { maxWidth:600, margin:"0 auto" },
  card: { background:"white", borderRadius:12, padding:"16px 18px", border:"1px solid #e5e7eb", boxShadow:"0 1px 3px rgba(0,0,0,.05)" },
  h1:   { fontSize:26, fontWeight:800, color:"#1f2937", margin:"0 0 10px", lineHeight:1.2 },
  sub:  { fontSize:14, color:"#6b7280", margin:0, lineHeight:1.6 },
  btnP: { display:"block", width:"100%", padding:"13px", background:"#1d4ed8", color:"white", border:"none", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer" },
  btnS: { display:"block", width:"100%", padding:"12px", background:"white", color:"#374151", border:"1px solid #e5e7eb", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" },
};