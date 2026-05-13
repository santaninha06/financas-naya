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

function fmtBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function fmtShort(v) {
  if (v >= 1000) return "R$" + (v / 1000).toFixed(1) + "k";
  return "R$" + v.toFixed(0);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

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
        const x1 = cx + R * Math.cos(angle);
        const y1 = cy + R * Math.sin(angle);
        angle += slice;
        const x2 = cx + R * Math.cos(angle);
        const y2 = cy + R * Math.sin(angle);
        const large = slice > Math.PI ? 1 : 0;
        return (
          <path
            key={i}
            d={`M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`}
            fill={e.color}
            opacity={0.9}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={35} fill="var(--card)" />
    </svg>
  );
}

// ─── APP ──────────────────────────────────────
export default function App() {
  const [txList, setTxList] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fin_tx") || "[]"); } catch { return []; }
  });
  const [hidden, setHidden] = useState(false);
  const [form, setForm] = useState({
    desc: "", amount: "", type: "expense", cat: "alimentacao", date: today(),
  });

  useEffect(() => {
    localStorage.setItem("fin_tx", JSON.stringify(txList));
  }, [txList]);

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
    txList.filter(t => t.type === "expense").forEach(t => {
      map[t.cat] = (map[t.cat] || 0) + t.amount;
    });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([cat, val]) => ({ cat, val, color: CAT[cat]?.color || "#5a7e68", label: CAT[cat]?.label || cat }));
  }, [txList]);

  function addTx() {
    const amt = parseFloat(form.amount);
    if (!form.desc.trim() || isNaN(amt) || amt <= 0) return;
    setTxList(prev => [...prev, { ...form, amount: amt, id: Date.now() }]);
    setForm(f => ({ ...f, desc: "", amount: "" }));
  }

  function deleteTx(id) {
    setTxList(prev => prev.filter(t => t.id !== id));
  }

  const maxBar = Math.max(...monthlyData.map(r => Math.max(r.inc, r.exp)), 1);
  const sortedTx = [...txList].sort((a, b) => b.date.localeCompare(a.date));

  const D = {
    // type toggle active states
    expActive: form.type === "expense",
    incActive: form.type === "income",
  };

  return (
    <>
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
        input, select { -webkit-appearance: none; appearance: none; }
        input:focus, select:focus { outline: none; border-color: var(--em) !important; }
        input::placeholder { color: var(--sub); }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>

        {/* HEADER */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(12,17,14,.9)", backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 1.25rem", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem" }}>
            Finanças<span style={{ color: "var(--em)", fontStyle: "italic" }}>Pro</span>
          </div>
          <button onClick={() => setHidden(h => !h)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--muted)", border: "1px solid var(--border)",
            color: "var(--sub)", borderRadius: 8,
            padding: "5px 12px", cursor: "pointer",
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

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "1.25rem 1rem 4rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {[
              { label: "Saldo", val: balance, color: balance < 0 ? "var(--red)" : "var(--text)", accent: balance < 0 ? "var(--red)" : "var(--em)" },
              { label: "Receitas", val: income, color: "var(--em)", accent: "var(--em)" },
              { label: "Despesas", val: expense, color: "var(--red)", accent: "var(--red)" },
            ].map(k => (
              <div key={k.label} style={{
                background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14,
                padding: "1rem 1.25rem", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.accent, borderRadius: "14px 14px 0 0" }} />
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".65rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", lineHeight: 1, color: k.color }}>
                  {hidden ? "••••" : fmtBRL(k.val)}
                </div>
              </div>
            ))}
          </div>

          {/* FORM */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", marginBottom: "1rem" }}>Nova transacao</div>

            {/* TYPE TOGGLE */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".65rem", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 6 }}>Tipo</div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 10, padding: 4, gap: 4,
              }}>
                {[
                  { val: "expense", label: "Despesa", activeStyle: { background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red)" } },
                  { val: "income",  label: "Receita",  activeStyle: { background: "var(--em-dim)",  color: "var(--em)",  border: "1px solid var(--em)"  } },
                ].map(opt => {
                  const isActive = form.type === opt.val;
                  return (
                    <button
                      key={opt.val}
                      onClick={() => setForm(f => ({ ...f, type: opt.val }))}
                      style={{
                        padding: "8px 0", border: "1px solid transparent",
                        borderRadius: 7, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", fontSize: ".82rem", fontWeight: 600,
                        transition: "all .18s",
                        ...(isActive ? opt.activeStyle : { background: "transparent", color: "var(--sub)" }),
                      }}
                    >
                      {isActive && <span style={{ marginRight: 5, fontSize: ".7rem" }}>●</span>}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              {[
                { id: "desc", label: "Descricao", placeholder: "Ex: Aluguel, Salario...", type: "text" },
                { id: "amount", label: "Valor (R$)", placeholder: "0,00", type: "number" },
              ].map(f => (
                <div key={f.id} style={{ gridColumn: f.id === "desc" ? "1 / -1" : undefined }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".65rem", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 5 }}>{f.label}</div>
                  <input
                    type={f.type} placeholder={f.placeholder}
                    value={form[f.id]}
                    onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: ".875rem" }}
                  />
                </div>
              ))}

              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".65rem", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 5 }}>Data</div>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: ".875rem" }} />
              </div>

              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".65rem", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 5 }}>Categoria</div>
                <select value={form.cat} onChange={e => setForm(p => ({ ...p, cat: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: ".875rem" }}>
                  {Object.entries(CAT).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <button onClick={addTx} style={{
              marginTop: 14, width: "100%", padding: "10px", borderRadius: 9, border: "none",
              background: form.type === "income" ? "var(--em)" : "var(--red)",
              color: form.type === "income" ? "#071a10" : "#fff",
              fontFamily: "'DM Sans', sans-serif", fontSize: ".875rem", fontWeight: 600, cursor: "pointer",
              transition: "opacity .2s",
            }}>
              Adicionar {form.type === "income" ? "Receita" : "Despesa"}
            </button>
          </div>

          {/* CHARTS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>

            {/* BAR */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", marginBottom: "1rem" }}>Evolucao mensal</div>
              {monthlyData.length === 0
                ? <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--sub)", fontFamily: "'DM Mono', monospace", fontSize: ".75rem", letterSpacing: ".05em" }}>Sem dados ainda</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                      {[{ color: "var(--em)", label: "Receita" }, { color: "var(--red)", label: "Despesa" }].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Mono', monospace", fontSize: ".65rem", color: "var(--sub)" }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
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
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".63rem", color: "var(--sub)", textAlign: "right", flexShrink: 0, lineHeight: 1.6, width: 60 }}>
                            <div style={{ color: "var(--em)" }}>{hidden ? "••" : fmtShort(r.inc)}</div>
                            <div style={{ color: "var(--red)" }}>{hidden ? "••" : fmtShort(r.exp)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>

            {/* DONUT */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", marginBottom: "1rem" }}>Categorias</div>
              {catExpenses.length === 0
                ? <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--sub)", fontFamily: "'DM Mono', monospace", fontSize: ".75rem", letterSpacing: ".05em" }}>Sem despesas</div>
                : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <Donut entries={catExpenses} />
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                      {catExpenses.map(e => (
                        <div key={e.cat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".8rem" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, color: "var(--text)" }}>{e.label}</div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".7rem", color: "var(--sub)" }}>{hidden ? "••" : fmtShort(e.val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
              }
            </div>
          </div>

          {/* TX LIST */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", marginBottom: "1rem" }}>Transacoes</div>
            {sortedTx.length === 0
              ? <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--sub)", fontFamily: "'DM Mono', monospace", fontSize: ".75rem", letterSpacing: ".05em" }}>Nenhuma transacao ainda</div>
              : sortedTx.map((t, i) => {
                  const c = CAT[t.cat] || CAT.outros;
                  return (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 0",
                      borderBottom: i < sortedTx.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0, fontSize: ".9rem" }}>
                        {c.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: ".875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.desc}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: ".67rem", color: "var(--sub)", marginTop: 2 }}>{t.date} · {c.label}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: t.type === "income" ? "var(--em)" : "var(--red)", flexShrink: 0 }}>
                        {hidden ? "••••" : (t.type === "income" ? "+" : "-") + fmtBRL(t.amount).replace("R$", "R$ ")}
                      </div>
                      <button onClick={() => deleteTx(t.id)} style={{
                        background: "none", border: "none", color: "var(--sub)", cursor: "pointer",
                        padding: 5, borderRadius: 6, display: "flex", alignItems: "center",
                        transition: "color .15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--sub)"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  );
                })
            }
          </div>

        </main>
      </div>
    </>
  );
}