import { useState, useRef, useEffect } from "react";

const DAILY_FREE_LIMIT = 10;

const MODELS = {
  chat: "claude-sonnet-4-20250514",
};

// ─── Utility ────────────────────────────────────────────────
function getTodayKey() { return "nm_" + new Date().toISOString().slice(0,10); }
function getUsage() { return parseInt(localStorage.getItem(getTodayKey()) || "0"); }
function incUsage() { localStorage.setItem(getTodayKey(), getUsage() + 1); }

// ─── Icons ──────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const icons = {
    chat: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    image: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    translate: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>,
    voice: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    crown: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M2 19h20v2H2v-2zm2-3l3-9 5 6 5-6 3 9H4z"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    clear: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    loader: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  };
  return icons[name] || null;
};

// ─── Claude API Call ─────────────────────────────────────────
async function callClaude(messages, system = "") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELS.chat,
      max_tokens: 1000,
      system: system || "You are NeuralMind AI, a helpful assistant. Be concise and helpful. Support both Urdu and English.",
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Error occurred.";
}

// ─── Paywall Modal ───────────────────────────────────────────
function PaywallModal({ onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(8px)" }}>
      <div style={{ background:"linear-gradient(145deg, #1a0a2e, #0f0f1a)", border:"1px solid #7c3aed", borderRadius:24, padding:"40px 36px", maxWidth:380, width:"90%", textAlign:"center", boxShadow:"0 0 60px rgba(124,58,237,0.3)" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>👑</div>
        <h2 style={{ color:"#fff", fontSize:22, fontWeight:700, marginBottom:8 }}>Free Limit Reached!</h2>
        <p style={{ color:"#a78bfa", fontSize:14, marginBottom:24, lineHeight:1.6 }}>
          Aap ne aaj ke 10 free messages use kar liye.<br/>
          Premium upgrade karo unlimited access ke liye!
        </p>
        <div style={{ background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", borderRadius:16, padding:"20px", marginBottom:24 }}>
          <div style={{ color:"#7c3aed", fontSize:12, fontWeight:600, letterSpacing:2, marginBottom:8 }}>PREMIUM PLAN</div>
          <div style={{ color:"#fff", fontSize:32, fontWeight:800 }}>Rs. 299<span style={{ fontSize:14, color:"#a78bfa", fontWeight:400 }}>/month</span></div>
          <div style={{ color:"#a78bfa", fontSize:12, marginTop:8 }}>Unlimited messages • All features • Priority AI</div>
        </div>
        <button style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg, #7c3aed, #4f46e5)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
          🚀 Upgrade to Premium
        </button>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:13 }}>
          Kal wapas aao (free limit reset hogi)
        </button>
      </div>
    </div>
  );
}

// ─── Chat Feature ────────────────────────────────────────────
function ChatFeature({ onLimitHit, checkLimit }) {
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Assalam-o-Alaikum! 👋 Main NeuralMind AI hoon. Aap se kaise madad kar sakta hoon? (Urdu ya English mein likho)" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    if (!checkLimit()) { onLimitHit(); return; }
    const userMsg = { role:"user", content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    incUsage();
    try {
      const reply = await callClaude([...messages, userMsg].filter(m => m.role !== "system"));
      setMessages(m => [...m, { role:"assistant", content: reply }]);
    } catch(e) {
      setMessages(m => [...m, { role:"assistant", content:"Error aaya. Dobara try karo." }]);
    }
    setLoading(false);
  }

  function copyMsg(text, idx) {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:0 }}>
      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start", gap:8, alignItems:"flex-end" }}>
            {m.role==="assistant" && (
              <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>🧠</div>
            )}
            <div style={{ position:"relative", maxWidth:"75%" }}>
              <div style={{
                padding:"10px 14px", borderRadius: m.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role==="user" ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.06)",
                border: m.role==="user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                color:"#f0f0f0", fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap"
              }}>{m.content}</div>
              {m.role==="assistant" && (
                <button onClick={() => copyMsg(m.content, i)} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.4)", border:"none", borderRadius:6, padding:"3px 6px", cursor:"pointer", color: copied===i ? "#00ff88" : "#888", fontSize:11 }}>
                  {copied===i ? "✓" : <Icon name="copy" size={12}/>}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🧠</div>
            <div style={{ padding:"10px 16px", background:"rgba(255,255,255,0.06)", borderRadius:"18px 18px 18px 4px", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed", animation:`bounce 1s ${i*0.2}s infinite` }}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
          placeholder="Kuch bhi poochho... (Urdu/English)"
          style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:"10px 16px", color:"#f0f0f0", fontSize:14, outline:"none", fontFamily:"inherit" }}
        />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ width:42, height:42, borderRadius:"50%", background: input.trim() ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.06)", border:"none", cursor: input.trim() ? "pointer" : "default", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
          <Icon name="send" size={16}/>
        </button>
      </div>
    </div>
  );
}

// ─── Image Generation Feature ────────────────────────────────
function ImageFeature({ onLimitHit, checkLimit }) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState("realistic");

  const styles = ["realistic","cartoon","anime","oil painting","watercolor","cyberpunk"];

  async function generate() {
    if (!prompt.trim() || loading) return;
    if (!checkLimit()) { onLimitHit(); return; }
    setLoading(true);
    incUsage();
    // Since we can't call actual image API, we use Claude to describe/generate prompt details
    const reply = await callClaude([{ role:"user", content:`Generate a detailed image description for: "${prompt}" in ${style} style. Make it vivid and artistic. Also suggest color palette. Keep response under 150 words.` }], "You are an AI art director. Describe images beautifully.");
    setResult(reply);
    setLoading(false);
  }

  return (
    <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16, height:"100%", overflowY:"auto" }}>
      <div>
        <label style={{ color:"#a78bfa", fontSize:12, fontWeight:600, letterSpacing:1 }}>IMAGE STYLE</label>
        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          {styles.map(s => (
            <button key={s} onClick={() => setStyle(s)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${style===s ? "#7c3aed" : "rgba(255,255,255,0.1)"}`, background: style===s ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)", color: style===s ? "#a78bfa" : "#888", cursor:"pointer", fontSize:12, fontFamily:"inherit", transition:"all 0.15s" }}>{s}</button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ color:"#a78bfa", fontSize:12, fontWeight:600, letterSpacing:1 }}>IMAGE PROMPT</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Describe karo kya banana hai... jaise 'Pakistan ki mountains at sunset with snow'"
          rows={3}
          style={{ width:"100%", marginTop:8, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 14px", color:"#f0f0f0", fontSize:14, outline:"none", fontFamily:"inherit", resize:"vertical", lineHeight:1.5 }}
        />
      </div>

      <button onClick={generate} disabled={!prompt.trim() || loading}
        style={{ padding:"13px", background: prompt.trim() ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.06)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor: prompt.trim() ? "pointer" : "default", fontFamily:"inherit", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        {loading ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</span> Generating...</> : "🎨 Generate Image"}
      </button>

      {result && (
        <div style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.3)", borderRadius:16, padding:20 }}>
          <div style={{ color:"#a78bfa", fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:12 }}>🖼️ AI GENERATED CONCEPT</div>
          {/* Visual placeholder */}
          <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:12, background:"linear-gradient(135deg, #1a0a2e, #0f1a2e, #1a2e0f)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, border:"1px solid rgba(124,58,237,0.2)", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(79,70,229,0.2) 0%, transparent 60%)" }}/>
            <div style={{ textAlign:"center", zIndex:1 }}>
              <div style={{ fontSize:48 }}>🎨</div>
              <div style={{ color:"#a78bfa", fontSize:12, marginTop:8 }}>AI Concept Visual</div>
            </div>
          </div>
          <p style={{ color:"#d4d4d8", fontSize:14, lineHeight:1.7 }}>{result}</p>
          <div style={{ marginTop:12, padding:"8px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8, color:"#666", fontSize:12 }}>
            💡 Full image generation ke liye DALL-E 3 ya Midjourney API integrate karo
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Translation Feature ─────────────────────────────────────
function TranslateFeature({ onLimitHit, checkLimit }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromLang, setFromLang] = useState("English");
  const [toLang, setToLang] = useState("Urdu");

  const langs = ["English","Urdu","Roman Urdu","Hindi","Arabic","French","Spanish","Chinese"];

  function swap() {
    setFromLang(toLang);
    setToLang(fromLang);
    setInput(output);
    setOutput(input);
  }

  async function translate() {
    if (!input.trim() || loading) return;
    if (!checkLimit()) { onLimitHit(); return; }
    setLoading(true);
    incUsage();
    const reply = await callClaude([{ role:"user", content:`Translate this from ${fromLang} to ${toLang}:\n\n${input}\n\nOnly provide the translation, nothing else.` }], "You are a professional translator. Provide accurate translations only.");
    setOutput(reply);
    setLoading(false);
  }

  return (
    <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16, height:"100%", overflowY:"auto" }}>
      {/* Lang selector */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ flex:1 }}>
          <label style={{ color:"#a78bfa", fontSize:11, fontWeight:600, letterSpacing:1 }}>FROM</label>
          <select value={fromLang} onChange={e => setFromLang(e.target.value)}
            style={{ width:"100%", marginTop:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"9px 12px", color:"#f0f0f0", fontSize:14, outline:"none", fontFamily:"inherit" }}>
            {langs.map(l => <option key={l} value={l} style={{ background:"#1a1a2e" }}>{l}</option>)}
          </select>
        </div>
        <button onClick={swap} style={{ marginTop:20, width:38, height:38, borderRadius:"50%", background:"rgba(124,58,237,0.2)", border:"1px solid rgba(124,58,237,0.4)", color:"#a78bfa", cursor:"pointer", fontSize:18 }}>⇄</button>
        <div style={{ flex:1 }}>
          <label style={{ color:"#a78bfa", fontSize:11, fontWeight:600, letterSpacing:1 }}>TO</label>
          <select value={toLang} onChange={e => setToLang(e.target.value)}
            style={{ width:"100%", marginTop:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"9px 12px", color:"#f0f0f0", fontSize:14, outline:"none", fontFamily:"inherit" }}>
            {langs.map(l => <option key={l} value={l} style={{ background:"#1a1a2e" }}>{l}</option>)}
          </select>
        </div>
      </div>

      <textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder={`${fromLang} mein text likho...`} rows={5}
        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 14px", color:"#f0f0f0", fontSize:14, outline:"none", fontFamily:"inherit", resize:"vertical", lineHeight:1.6 }}
      />

      <button onClick={translate} disabled={!input.trim() || loading}
        style={{ padding:"13px", background: input.trim() ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.06)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor: input.trim() ? "pointer" : "default", fontFamily:"inherit" }}>
        {loading ? "Translating..." : `🌐 Translate to ${toLang}`}
      </button>

      {output && (
        <div style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.3)", borderRadius:12, padding:16 }}>
          <div style={{ color:"#a78bfa", fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:10 }}>TRANSLATION ({toLang.toUpperCase()})</div>
          <p style={{ color:"#f0f0f0", fontSize:15, lineHeight:1.8, direction: toLang==="Urdu"||toLang==="Arabic" ? "rtl" : "ltr" }}>{output}</p>
          <button onClick={() => navigator.clipboard.writeText(output)}
            style={{ marginTop:10, background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 12px", color:"#888", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
            📋 Copy
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Voice Feature ───────────────────────────────────────────
function VoiceFeature({ onLimitHit, checkLimit }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recRef = useRef(null);

  function startRecording() {
    if (!supported) return;
    if (!checkLimit()) { onLimitHit(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "ur-PK";
    rec.interimResults = false;
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setRecording(false);
      setLoading(true);
      incUsage();
      const reply = await callClaude([{ role:"user", content: text }]);
      setAiReply(reply);
      setLoading(false);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }

  function stopRecording() {
    recRef.current?.stop();
    setRecording(false);
  }

  function speak(text) {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ur-PK";
    window.speechSynthesis.speak(utt);
  }

  return (
    <div style={{ padding:20, display:"flex", flexDirection:"column", alignItems:"center", gap:24, height:"100%", overflowY:"auto" }}>
      <div style={{ textAlign:"center", paddingTop:20 }}>
        <h3 style={{ color:"#fff", fontSize:18, fontWeight:600, marginBottom:8 }}>Voice to Text AI</h3>
        <p style={{ color:"#888", fontSize:13 }}>Urdu ya English mein bolo — AI jawab dega</p>
      </div>

      {/* Mic Button */}
      <div style={{ position:"relative" }}>
        {recording && (
          <>
            <div style={{ position:"absolute", inset:-20, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.4)", animation:"ripple 1.5s ease-out infinite" }}/>
            <div style={{ position:"absolute", inset:-10, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.6)", animation:"ripple 1.5s 0.5s ease-out infinite" }}/>
          </>
        )}
        <button onClick={recording ? stopRecording : startRecording}
          style={{ width:100, height:100, borderRadius:"50%", background: recording ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", border:"none", cursor:"pointer", fontSize:36, boxShadow: recording ? "0 0 30px rgba(239,68,68,0.5)" : "0 0 30px rgba(124,58,237,0.4)", transition:"all 0.3s" }}>
          {recording ? "⏹" : "🎤"}
        </button>
      </div>

      <p style={{ color: recording ? "#ef4444" : "#888", fontSize:13, fontWeight: recording ? 600 : 400 }}>
        {recording ? "🔴 Recording... (stop ke liye click karo)" : supported ? "Mic button dabao aur bolo" : "❌ Browser mein voice support nahi"}
      </p>

      {transcript && (
        <div style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:16 }}>
          <div style={{ color:"#a78bfa", fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:8 }}>TUMNE KAHA:</div>
          <p style={{ color:"#f0f0f0", fontSize:15 }}>{transcript}</p>
        </div>
      )}

      {loading && <div style={{ color:"#a78bfa", fontSize:14 }}>🧠 AI soch raha hai...</div>}

      {aiReply && (
        <div style={{ width:"100%", background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.3)", borderRadius:12, padding:16 }}>
          <div style={{ color:"#a78bfa", fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:8 }}>AI KA JAWAB:</div>
          <p style={{ color:"#f0f0f0", fontSize:15, lineHeight:1.7 }}>{aiReply}</p>
          <button onClick={() => speak(aiReply)}
            style={{ marginTop:12, background:"rgba(124,58,237,0.2)", border:"1px solid rgba(124,58,237,0.4)", borderRadius:8, padding:"8px 16px", color:"#a78bfa", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
            🔊 Sunaao
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function NeuralMindApp() {
  const [activeTab, setActiveTab] = useState("chat");
  const [showPaywall, setShowPaywall] = useState(false);
  const [usage, setUsage] = useState(getUsage());
  const [isPremium] = useState(false);

  function checkLimit() {
    if (isPremium) return true;
    const u = getUsage();
    setUsage(u);
    return u < DAILY_FREE_LIMIT;
  }

  const tabs = [
    { id:"chat", label:"AI Chat", icon:"chat" },
    { id:"image", label:"Images", icon:"image" },
    { id:"translate", label:"Translate", icon:"translate" },
    { id:"voice", label:"Voice", icon:"voice" },
  ];

  const remaining = Math.max(0, DAILY_FREE_LIMIT - usage);

  return (
    <div style={{
      minHeight:"100vh", background:"#0a0a12",
      display:"flex", flexDirection:"column",
      fontFamily:"'Outfit', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#7c3aed44; border-radius:2px; }
        textarea, input, select { color-scheme: dark; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ripple { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.5);opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)}/>}

      {/* Header */}
      <div style={{ background:"rgba(10,10,18,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(124,58,237,0.2)", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🧠</div>
          <div>
            <div style={{ color:"#fff", fontWeight:700, fontSize:16, letterSpacing:0.5 }}>NeuralMind AI</div>
            <div style={{ color:"#7c3aed", fontSize:10, fontWeight:600, letterSpacing:2 }}>PAKISTAN'S AI ASSISTANT</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {!isPremium && (
            <div style={{ background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", borderRadius:20, padding:"4px 12px", fontSize:12, color: remaining <= 3 ? "#ef4444" : "#a78bfa" }}>
              {remaining} msgs left
            </div>
          )}
          <button onClick={() => setShowPaywall(true)}
            style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", border:"none", borderRadius:20, padding:"6px 14px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            <Icon name="crown" size={13}/> Premium
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ background:"rgba(10,10,18,0.8)", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", padding:"0 16px" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex:1, padding:"12px 8px", background:"none", border:"none", borderBottom: activeTab===tab.id ? "2px solid #7c3aed" : "2px solid transparent", color: activeTab===tab.id ? "#a78bfa" : "#555", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:4, transition:"all 0.2s" }}>
            <Icon name={tab.icon} size={18}/>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeIn 0.3s ease" }}>
        {activeTab==="chat" && <ChatFeature onLimitHit={() => setShowPaywall(true)} checkLimit={checkLimit}/>}
        {activeTab==="image" && <ImageFeature onLimitHit={() => setShowPaywall(true)} checkLimit={checkLimit}/>}
        {activeTab==="translate" && <TranslateFeature onLimitHit={() => setShowPaywall(true)} checkLimit={checkLimit}/>}
        {activeTab==="voice" && <VoiceFeature onLimitHit={() => setShowPaywall(true)} checkLimit={checkLimit}/>}
      </div>

      {/* Bottom bar */}
      <div style={{ background:"rgba(10,10,18,0.95)", borderTop:"1px solid rgba(255,255,255,0.04)", padding:"8px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:"#333", fontSize:11 }}>NeuralMind AI v1.0 • Pakistan</span>
        <span style={{ color:"#333", fontSize:11 }}>Powered by Claude AI</span>
      </div>
    </div>
  );
}
