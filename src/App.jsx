import { useState, useMemo, useEffect } from "react";

// ─── CATEGORIAS ───────────────────────────────
const CAT = {
  alimentacao: { label: "Alimentacao", color: "#fbbf24", icon: "▲" },
  transporte:  { label: "Transporte",  color: "#22d3ee", icon: "◆" },
  moradia:     { label: "Moradia",     color: "#818cf8", icon: "■" },
  saude:       { label: "Saude",       color: "#fb7185", icon: "◉" },
  lazer:       { label: "Lazer",       color: "#a78bfa", icon: "◈" },
  outros:      { label: "Outros",      color: "#5a7e68", icon: "●" },
};

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const META_ICONS = ["◎","◈","◆","■","▲","●","◉","★","◐","◑"];
const META_COLORS = [
  "#34d399","#22d3ee","#a78bfa","#fbbf24","#fb7185","#818cf8","#f97316","#06b6d4","#84cc16","#e879f9"
];

function fmtBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function fmtShort(v) {
  if (v >= 1000) return "R$" + (v / 1000).toFixed(1) + "k";
  return "R$" + v.toFixed(0);
}
function today() { return new Date().toISOString().slice(0, 10); }
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

// ─── DONUT SVG ────────────────────────────────
function Donut({ entries }) {
  const total = entries.reduce((s, e) => s + e.val, 0);
  const R = 60, cx = 80, cy = 80;
  let angle = -Math.PI / 2;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" style={{ overflow: "visible" }}>
      <circle cx={cx} cy={cy} r={35} fill="var(--card)" />
      {entries.map((e, i) => {
        const slice = (e.val / total) * Math.PI * 2;
        const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
        angle += slice;
        const x2 = cx + R * Math.cos(angle), y2 = cy + R * Math.sin(angle);
        const large = slice > Math.PI ? 1 : 0;
        return <path key={i} d={`M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`} fill={e.color} opacity={0.9} />;
      })}
      <circle cx={cx} cy={cy} r={35} fill="var(--card)" />
    </svg>
  );
}

// ─── PROGRESS RING ────────────────────────────
function Ring({ pct, color, size = 54 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * clamp(pct, 0, 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--muted)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray .6s ease" }} />
    </svg>
  );
}

// ─── GLOBAL STYLES ────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:      #0c110e;
      --surface: #121a14;
      --card:    #16201a;
      --border:  #213028;
      --em:      #34d399;
      --em-dim:  #1a5c40;
      --red:     #f87171;
      --red-dim: #5c1a1a;
      --text:    #d4ead9;
      --sub:     #5a7e68;
      --muted:   #2a3d30;
    }
    body { background: var(--bg); }
    input, select, textarea { -webkit-appearance: none; appearance: none; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--em) !important; }
    input::placeholder, textarea::placeholder { color: var(--sub); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  `}</style>
);

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 9,
  border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: ".875rem",
};
const labelStyle = {
  fontFamily: "'DM Mono', monospace", fontSize: ".65rem",
  letterSpacing: ".09em", textTransform: "uppercase",
  color: "var(--sub)", marginBottom: 5, display: "block",
};
const cardStyle = {
  background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem",
};
const titleStyle = {
  fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", marginBottom: "1rem",
};

// ─── HELPERS ──────────────────────────────────
function Empty({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--sub)", fontFamily: "'DM Mono', monospace", fontSize: ".75rem", letterSpacing: ".05em" }}>
      {text}
    </div>
  );
}

function DeleteBtn({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "var(--red-dim)" : "none", border: "1px solid",
        borderColor: hov ? "var(--red)" : "var(--border)",
        color: hov ? "var(--red)" : "var(--sub)", cursor: "pointer",
        padding: "7px 8px", borderRadius: 8, display: "flex", alignItems: "center",
        transition: "all .15s",
      }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
      </svg>
    </button>
  );
}

// ─── NAVEGACAO ────────────────────────────────
function Nav({ page, setPage }) {
  return (
    <div style={{ display: "flex", gap: 3, background: "var(--muted)", borderRadius: 10, padding: 3 }}>
      {[{ id: "dashboard", label: "Painel" }, { id: "metas", label: "Metas" }].map(t => (
        <button key={t.id} onClick={() => setPage(t.id)} style={{
          padding: "6px 14px", border: "none", borderRadius: 7, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontSize: ".78rem", fontWeight: 600,
          transition: "all .18s",
          background: page === t.id ? "var(--card)" : "transparent",
          color: page === t.id ? "var(--text)" : "var(--sub)",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ─── PAGINA DASHBOARD ─────────────────────────
function Dashboard({ txList, setTxList, hidden }) {
  const [form, setForm] = useState({
    desc: "", amount: "", type: "expense", cat: "alimentacao", date: today(),
  });

  const income  = useMemo(() => txList.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [txList]);
  const expense = useMemo(() => txList.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [txList]);
  const balance = income - expense;

  const monthlyData = useMemo(() => {
    const map = {};
    txList.forEach(t => {
      const k = t.date.slice(0, 7);
      if (!map[k]) map[k] = { k, inc: 0, exp: 0 };
      t.type === "income" ? (map[k].inc += t.amount) : (map[k].exp += t.amount);
    });
    return Object.values(map).sort((a, b) => a.k.localeCompare(b.k)).slice(-6);
  }, [txList]);

  const catExpenses = useMemo(() => {
    const map = {};
    txList.filter(t => t.type === "expense").forEach(t => { map[t.cat] = (map[t.cat] || 0) + t.amount; });
    return Object.entries(map).filter(([, v]) => v > 0)
      .map(([cat, val]) => ({ cat, val, color: CAT[cat]?.color || "#5a7e68", label: CAT[cat]?.label || cat }));
  }, [txList]);

  function addTx() {
    const amt = parseFloat(form.amount);
    if (!form.desc.trim() || isNaN(amt) || amt <= 0) return;
    setTxList(prev => [...prev, { ...form, amount: amt, id: Date.now() }]);
    setForm(f => ({ ...f, desc: "", amount: "" }));
  }

  const maxBar = Math.max(...monthlyData.map(r => Math.max(r.inc, r.exp)), 1);
  const sortedTx = [...txList].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {[
          { label: "Saldo",    val: balance, color: balance < 0 ? "var(--red)" : "var(--text)", accent: balance < 0 ? "var(--red)" : "var(--em)" },
          { label: "Receitas", val: income,  color: "var(--em)",  accent: "var(--em)"  },
          { label: "Despesas", val: expense, color: "var(--red)", accent: "var(--red)" },
        ].map(k => (
          <div key={k.label} style={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.accent, borderRadius: "14px 14px 0 0" }} />
            <div style={{ ...labelStyle, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", lineHeight: 1, color: k.color }}>
              {hidden ? "••••" : fmtBRL(k.val)}
            </div>
          </div>
        ))}
      </div>

      {/* FORM */}
      <div style={cardStyle}>
        <div style={titleStyle}>Nova transacao</div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Tipo</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, gap: 4 }}>
            {[
              { val: "expense", label: "Despesa", ac: { background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red)" } },
              { val: "income",  label: "Receita",  ac: { background: "var(--em-dim)",  color: "var(--em)",  border: "1px solid var(--em)"  } },
            ].map(opt => {
              const active = form.type === opt.val;
              return (
                <button key={opt.val} onClick={() => setForm(f => ({ ...f, type: opt.val }))} style={{
                  padding: "8px 0", borderRadius: 7, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: ".82rem", fontWeight: 600, transition: "all .18s",
                  ...(active ? opt.ac : { background: "transparent", color: "var(--sub)", border: "1px solid transparent" }),
                }}>
                  {active && <span style={{ marginRight: 5, fontSize: ".7rem" }}>●</span>}{opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Descricao</label>
            <input style={inputStyle} placeholder="Ex: Aluguel, Salario..."
              value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Valor (R$)</label>
            <input style={inputStyle} type="number" placeholder="0,00"
              value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Data</label>
            <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Categoria</label>
            <select style={inputStyle} value={form.cat} onChange={e => setForm(p => ({ ...p, cat: e.target.value }))}>
              {Object.entries(CAT).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <button onClick={addTx} style={{
              width: "100%", padding: "10px", borderRadius: 9, border: "none",
              background: form.type === "income" ? "var(--em)" : "var(--red)",
              color: form.type === "income" ? "#071a10" : "#fff",
              fontFamily: "'DM Sans', sans-serif", fontSize: ".875rem", fontWeight: 600, cursor: "pointer",
            }}>
              Adicionar {form.type === "income" ? "Receita" : "Despesa"}
            </button>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        <div style={cardStyle}>
          <div style={titleStyle}>Evolucao mensal</div>
          {monthlyData.length === 0 ? <Empty text="Sem dados ainda" /> : (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                {[{ color: "var(--em)", label: "Receita" }, { color: "var(--red)", label: "Despesa" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Mono', monospace", fontSize: ".65rem", color: "var(--sub)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />{l.label}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {monthlyData.map(r => {
                  const [, m] = r.k.split("-");
                  return (
                    <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".68rem", color: "var(--sub)", width: 28, flexShrink: 0 }}>{MONTHS[+m - 1]}</div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ height: 9, background: "var(--muted)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(r.inc / maxBar) * 100}%`, background: "var(--em)", borderRadius: 4, transition: "width .5s ease" }} />
                        </div>
                        <div style={{ height: 9, background: "var(--muted)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(r.exp / maxBar) * 100}%`, background: "var(--red)", borderRadius: 4, transition: "width .5s ease" }} />
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".63rem", textAlign: "right", flexShrink: 0, lineHeight: 1.6, width: 60 }}>
                        <div style={{ color: "var(--em)" }}>{hidden ? "••" : fmtShort(r.inc)}</div>
                        <div style={{ color: "var(--red)" }}>{hidden ? "••" : fmtShort(r.exp)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div style={cardStyle}>
          <div style={titleStyle}>Categorias</div>
          {catExpenses.length === 0 ? <Empty text="Sem despesas" /> : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <Donut entries={catExpenses} />
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                {catExpenses.map(e => (
                  <div key={e.cat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".8rem" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>{e.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".7rem", color: "var(--sub)" }}>{hidden ? "••" : fmtShort(e.val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TX LIST */}
      <div style={cardStyle}>
        <div style={titleStyle}>Transacoes</div>
        {sortedTx.length === 0 ? <Empty text="Nenhuma transacao ainda" /> : sortedTx.map((t, i) => {
          const c = CAT[t.cat] || CAT.outros;
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: i < sortedTx.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0, fontSize: ".9rem" }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: ".875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.desc}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".67rem", color: "var(--sub)", marginTop: 2 }}>{t.date} · {c.label}</div>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: t.type === "income" ? "var(--em)" : "var(--red)", flexShrink: 0 }}>
                {hidden ? "••••" : (t.type === "income" ? "+" : "-") + fmtBRL(t.amount)}
              </div>
              <DeleteBtn onClick={() => setTxList(prev => prev.filter(x => x.id !== t.id))} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGINA METAS ─────────────────────────────
function Metas({ hidden }) {
  const [metas, setMetas] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fin_metas") || "[]"); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]   = useState(null);
  const [aporte, setAporte]   = useState({ id: null, val: "" });
  const [form, setForm] = useState({ nome: "", objetivo: "", atual: "0", prazo: "", icone: META_ICONS[0], cor: META_COLORS[0] });

  useEffect(() => { localStorage.setItem("fin_metas", JSON.stringify(metas)); }, [metas]);

  function openNew() {
    setEditId(null);
    setForm({ nome: "", objetivo: "", atual: "0", prazo: "", icone: META_ICONS[0], cor: META_COLORS[0] });
    setShowForm(true);
  }
  function openEdit(m) {
    setEditId(m.id);
    setForm({ nome: m.nome, objetivo: String(m.objetivo), atual: String(m.atual), prazo: m.prazo, icone: m.icone, cor: m.cor });
    setShowForm(true);
  }
  function saveMeta() {
    const obj = parseFloat(form.objetivo), atu = parseFloat(form.atual) || 0;
    if (!form.nome.trim() || isNaN(obj) || obj <= 0) return;
    if (editId) {
      setMetas(prev => prev.map(m => m.id === editId ? { ...m, ...form, objetivo: obj, atual: atu } : m));
    } else {
      setMetas(prev => [...prev, { ...form, objetivo: obj, atual: atu, id: Date.now() }]);
    }
    setShowForm(false); setEditId(null);
  }
  function addAporte() {
    const val = parseFloat(aporte.val);
    if (isNaN(val) || val <= 0) return;
    setMetas(prev => prev.map(m => m.id === aporte.id ? { ...m, atual: Math.min(m.atual + val, m.objetivo) } : m));
    setAporte({ id: null, val: "" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem" }}>Minhas Metas</div>
        <button onClick={openNew} style={{
          padding: "8px 16px", border: "none", borderRadius: 9,
          background: "var(--em)", color: "#071a10",
          fontFamily: "'DM Sans', sans-serif", fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
        }}>+ Nova Meta</button>
      </div>

      {/* FORM */}
      {showForm && (
        <div style={{ ...cardStyle, border: "1px solid var(--em-dim)" }}>
          <div style={{ ...titleStyle, color: "var(--em)" }}>{editId ? "Editar Meta" : "Nova Meta"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nome da meta</label>
              <input style={inputStyle} placeholder="Ex: Viagem, Carro, Reserva..."
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Objetivo (R$)</label>
              <input style={inputStyle} type="number" placeholder="0,00"
                value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Valor atual (R$)</label>
              <input style={inputStyle} type="number" placeholder="0,00"
                value={form.atual} onChange={e => setForm(f => ({ ...f, atual: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Prazo (opcional)</label>
              <input style={{ ...inputStyle, maxWidth: 220 }} type="date" value={form.prazo}
                onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Icone</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {META_ICONS.map(ic => (
                  <button key={ic} onClick={() => setForm(f => ({ ...f, icone: ic }))} style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: `1px solid ${form.icone === ic ? form.cor : "var(--border)"}`,
                    background: form.icone === ic ? "var(--muted)" : "var(--surface)",
                    color: form.icone === ic ? form.cor : "var(--sub)",
                    cursor: "pointer", fontSize: "1rem", transition: "all .15s",
                  }}>{ic}</button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Cor</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {META_COLORS.map(cor => (
                  <button key={cor} onClick={() => setForm(f => ({ ...f, cor }))} style={{
                    width: 28, height: 28, borderRadius: "50%", background: cor,
                    border: form.cor === cor ? "2px solid var(--text)" : "2px solid transparent",
                    cursor: "pointer", transition: "border .15s",
                  }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={saveMeta} style={{
              flex: 1, padding: "10px", borderRadius: 9, border: "none",
              background: "var(--em)", color: "#071a10",
              fontFamily: "'DM Sans', sans-serif", fontSize: ".875rem", fontWeight: 600, cursor: "pointer",
            }}>{editId ? "Salvar alteracoes" : "Criar Meta"}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{
              padding: "10px 16px", borderRadius: 9, border: "1px solid var(--border)",
              background: "transparent", color: "var(--sub)",
              fontFamily: "'DM Sans', sans-serif", fontSize: ".875rem", cursor: "pointer",
            }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL APORTE */}
      {aporte.id && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ ...cardStyle, width: "100%", maxWidth: 340, border: "1px solid var(--em-dim)" }}>
            <div style={{ ...titleStyle, color: "var(--em)" }}>Adicionar aporte</div>
            <label style={labelStyle}>Valor (R$)</label>
            <input style={{ ...inputStyle, marginBottom: 12 }} type="number" placeholder="0,00" autoFocus
              value={aporte.val} onChange={e => setAporte(a => ({ ...a, val: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addAporte()} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addAporte} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "var(--em)", color: "#071a10", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer" }}>Confirmar</button>
              <button onClick={() => setAporte({ id: null, val: "" })} style={{ padding: "10px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--sub)", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ESTADO VAZIO */}
      {metas.length === 0 && !showForm && (
        <div style={{ ...cardStyle, textAlign: "center", padding: "3.5rem 1.25rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 14, color: "var(--sub)" }}>◎</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", marginBottom: 6 }}>Nenhuma meta ainda</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".72rem", color: "var(--sub)", letterSpacing: ".05em" }}>Crie uma meta para acompanhar seu progresso</div>
        </div>
      )}

      {/* CARDS DE METAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1rem" }}>
        {metas.map(m => {
          const pct = m.objetivo > 0 ? m.atual / m.objetivo : 0;
          const pctDisplay = Math.min(pct * 100, 100).toFixed(0);
          const concluida = pct >= 1;
          const diasRestantes = m.prazo
            ? Math.ceil((new Date(m.prazo + "T00:00:00") - new Date()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <div key={m.id} style={{ ...cardStyle, border: `1px solid ${concluida ? m.cor + "55" : "var(--border)"}`, position: "relative", overflow: "hidden" }}>
              {concluida && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: m.cor }} />}

              {/* TOPO */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: m.cor + "22", border: `1px solid ${m.cor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: m.cor }}>
                  {m.icone}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.nome}
                    {concluida && <span style={{ marginLeft: 7, fontSize: ".6rem", color: m.cor, fontFamily: "'DM Mono', monospace", letterSpacing: ".06em" }}>CONCLUIDA</span>}
                  </div>
                  {m.prazo && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".65rem", color: diasRestantes !== null && diasRestantes < 0 ? "var(--red)" : "var(--sub)" }}>
                      {diasRestantes === null ? "" : diasRestantes < 0 ? `Prazo encerrado ha ${Math.abs(diasRestantes)}d` : diasRestantes === 0 ? "Prazo: hoje" : `${diasRestantes} dias restantes`}
                    </div>
                  )}
                </div>
                <Ring pct={pct} color={m.cor} size={50} />
              </div>

              {/* VALORES */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.25rem", color: m.cor }}>
                  {hidden ? "••••" : fmtBRL(m.atual)}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".68rem", color: "var(--sub)" }}>
                  de {hidden ? "••••" : fmtBRL(m.objetivo)}
                </div>
                <div style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: ".75rem", color: m.cor, fontWeight: 500 }}>
                  {pctDisplay}%
                </div>
              </div>

              {/* BARRA */}
              <div style={{ height: 5, background: "var(--muted)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", borderRadius: 4, background: m.cor, width: `${pctDisplay}%`, transition: "width .6s ease" }} />
              </div>

              {!concluida && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".67rem", color: "var(--sub)", marginBottom: 12 }}>
                  Faltam {hidden ? "••••" : fmtBRL(m.objetivo - m.atual)}
                </div>
              )}

              {/* ACOES */}
              <div style={{ display: "flex", gap: 6 }}>
                {!concluida && (
                  <button onClick={() => setAporte({ id: m.id, val: "" })} style={{
                    flex: 1, padding: "7px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${m.cor}44`, background: m.cor + "18", color: m.cor,
                    fontFamily: "'DM Sans', sans-serif", fontSize: ".75rem", fontWeight: 600,
                  }}>+ Aportar</button>
                )}
                <button onClick={() => openEdit(m)} style={{
                  padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--sub)",
                  fontFamily: "'DM Sans', sans-serif", fontSize: ".75rem", cursor: "pointer",
                }}>Editar</button>
                <DeleteBtn onClick={() => setMetas(prev => prev.filter(x => x.id !== m.id))} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────
export default function App() {
  const [txList, setTxList] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fin_tx") || "[]"); } catch { return []; }
  });
  const [hidden, setHidden] = useState(false);
  const [page,   setPage]   = useState("dashboard");

  useEffect(() => { localStorage.setItem("fin_tx", JSON.stringify(txList)); }, [txList]);

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>

        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(12,17,14,.9)", backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 1.25rem", height: 56,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", marginRight: "auto" }}>
            Finanças<span style={{ color: "var(--em)", fontStyle: "italic" }}>Pro</span>
          </div>

          <Nav page={page} setPage={setPage} />

          <button onClick={() => setHidden(h => !h)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--muted)", border: "1px solid var(--border)",
            color: "var(--sub)", borderRadius: 8, padding: "5px 12px", cursor: "pointer",
            fontFamily: "'DM Mono', monospace", fontSize: "0.68rem",
            letterSpacing: ".08em", textTransform: "uppercase",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {hidden
                ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
              }
            </svg>
            {hidden ? "Mostrar" : "Ocultar"}
          </button>
        </header>

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem 4rem" }}>
          {page === "dashboard"
            ? <Dashboard txList={txList} setTxList={setTxList} hidden={hidden} />
            : <Metas hidden={hidden} />
          }
        </main>
      </div>
    </>
  );
}