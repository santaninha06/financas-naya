import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import {
  TrendingUp, TrendingDown, Wallet, Target,
  Plus, Trash2, Edit3,
  Home, Car, Utensils, Activity,
  Gamepad2, BarChart3, DollarSign,
  ArrowUpRight, ArrowDownRight,
  Eye, EyeOff,
} from "lucide-react";

// ─────────────────────────────────────────────
// CORES
// ─────────────────────────────────────────────
const C = {
  bg: "#0a0f0d",
  surface: "#111a15",
  card: "#162010",
  border: "#1e3020",
  emerald: "#10b981",
  emeraldD: "#059669",
  cyan: "#06b6d4",
  red: "#f43f5e",
  amber: "#f59e0b",
  muted: "#4b6855",
  text: "#e2f0e8",
  textSub: "#7aad8a",
};

// ─────────────────────────────────────────────
// CATEGORIAS
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id:"alimentacao", label:"Alimentação", icon:Utensils, color:C.amber },
  { id:"transporte", label:"Transporte", icon:Car, color:C.cyan },
  { id:"moradia", label:"Moradia", icon:Home, color:"#818cf8" },
  { id:"saude", label:"Saúde", icon:Activity, color:"#fb7185" },
  { id:"lazer", label:"Lazer", icon:Gamepad2, color:"#a78bfa" },
  { id:"outros", label:"Outros", icon:DollarSign, color:C.muted },
];

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style:"currency",
    currency:"BRL",
  }).format(v);

const monthKey = (d) => d.slice(0,7);

const monthLabel = (k) => {
  const [y,m] = k.split("-");
  return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][+m-1];
};

// ─────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────
const S = {
  app:{
    minHeight:"100vh",
    background:C.bg,
    color:C.text,
    fontFamily:"sans-serif",
  },

  card:{
    background:C.card,
    border:`1px solid ${C.border}`,
    borderRadius:16,
    padding:"1rem",
  },

  input:{
    width:"100%",
    padding:"10px",
    borderRadius:8,
    border:`1px solid ${C.border}`,
    background:C.surface,
    color:C.text,
  },

  btn:{
    padding:"10px 16px",
    border:"none",
    borderRadius:10,
    background:C.emerald,
    color:"#fff",
    cursor:"pointer",
    fontWeight:600,
  }
};

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function App(){

  // LOCAL STORAGE
  const [txList, setTxList] = useState(() => {
    const saved = localStorage.getItem("financas_tx");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("financas_tx", JSON.stringify(txList));
  }, [txList]);

  const [hideValues, setHideValues] = useState(false);

  const [form, setForm] = useState({
    desc:"",
    amount:"",
    type:"expense",
    cat:"alimentacao",
    date:new Date().toISOString().slice(0,10),
  });

  // ─────────────────────────────────────────────
  // CALCULOS
  // ─────────────────────────────────────────────
  const income = useMemo(
    ()=>txList
      .filter(t=>t.type==="income")
      .reduce((a,t)=>a+t.amount,0),
    [txList]
  );

  const expense = useMemo(
    ()=>txList
      .filter(t=>t.type==="expense")
      .reduce((a,t)=>a+t.amount,0),
    [txList]
  );

  const balance = income - expense;

  // GRAFICO MENSAL
  const monthlyData = useMemo(() => {

    const map = {};

    txList.forEach(t => {

      const k = monthKey(t.date);

      if(!map[k]){
        map[k] = {
          mes: monthLabel(k),
          receita:0,
          despesa:0,
        };
      }

      if(t.type==="income"){
        map[k].receita += t.amount;
      } else {
        map[k].despesa += t.amount;
      }

    });

    return Object.values(map);

  }, [txList]);

  // GRAFICO CATEGORIA
  const catExpenses = useMemo(() => {

    const map = {};

    txList
      .filter(t=>t.type==="expense")
      .forEach(t=>{
        map[t.cat] = (map[t.cat] || 0) + t.amount;
      });

    return CATEGORIES.map(c => ({
      ...c,
      value: map[c.id] || 0,
    })).filter(c => c.value > 0);

  }, [txList]);

  // ─────────────────────────────────────────────
  // ADD
  // ─────────────────────────────────────────────
  const addTx = () => {

    if(!form.desc || !form.amount) return;

    setTxList(prev => [
      ...prev,
      {
        ...form,
        amount:Number(form.amount),
        id:Date.now(),
      }
    ]);

    setForm({
      desc:"",
      amount:"",
      type:"expense",
      cat:"alimentacao",
      date:new Date().toISOString().slice(0,10),
    });
  };

  // DELETE
  const deleteTx = (id) => {
    setTxList(prev => prev.filter(t=>t.id!==id));
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return(
    <div style={S.app}>

      {/* HEADER */}
      <div style={{
        padding:"1rem 1.5rem",
        borderBottom:`1px solid ${C.border}`,
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
      }}>
        <h1 style={{margin:0,fontSize:22}}>
          FinançasPro
        </h1>

        <button
          style={S.btn}
          onClick={()=>setHideValues(v=>!v)}
        >
          {hideValues ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>
      </div>

      <main style={{
        maxWidth:1200,
        margin:"0 auto",
        padding:"1rem",
      }}>

        {/* CARDS */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
          gap:16,
          marginBottom:20,
        }}>

          <div style={S.card}>
            <div>Saldo</div>
            <h2>
              {hideValues ? "••••" : fmt(balance)}
            </h2>
          </div>

          <div style={S.card}>
            <div>Receitas</div>
            <h2 style={{color:C.emerald}}>
              {hideValues ? "••••" : fmt(income)}
            </h2>
          </div>

          <div style={S.card}>
            <div>Despesas</div>
            <h2 style={{color:C.red}}>
              {hideValues ? "••••" : fmt(expense)}
            </h2>
          </div>

        </div>

        {/* FORM */}
        <div style={{
          ...S.card,
          marginBottom:20,
        }}>

          <h2>Nova Transação</h2>

          <div style={{
            display:"grid",
            gap:12,
          }}>

            <input
              style={S.input}
              placeholder="Descrição"
              value={form.desc}
              onChange={e=>setForm({...form, desc:e.target.value})}
            />

            <input
              style={S.input}
              type="number"
              placeholder="Valor"
              value={form.amount}
              onChange={e=>setForm({...form, amount:e.target.value})}
            />

            {/* TIPO */}
            <select
              style={S.input}
              value={form.type}
              onChange={e=>setForm({...form, type:e.target.value})}
            >
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>

            {/* CATEGORIA */}
            <select
              style={S.input}
              value={form.cat}
              onChange={e=>setForm({...form, cat:e.target.value})}
            >
              {CATEGORIES.map(c=>(
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              style={S.input}
              type="date"
              value={form.date}
              onChange={e=>setForm({...form, date:e.target.value})}
            />

            <button
              style={S.btn}
              onClick={addTx}
            >
              <Plus size={16}/>
              Adicionar
            </button>

          </div>
        </div>

        {/* GRAFICOS */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"2fr 1fr",
          gap:16,
          marginBottom:20,
        }}>

          {/* AREA CHART */}
          <div style={S.card}>
            <h2>Evolução Mensal</h2>

            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke={C.emerald}
                  fill={C.emerald}
                />

                <Area
                  type="monotone"
                  dataKey="despesa"
                  stroke={C.red}
                  fill={C.red}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* PIE */}
          <div style={S.card}>
            <h2>Categorias</h2>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>

                <Pie
                  data={catExpenses}
                  dataKey="value"
                  nameKey="label"
                  outerRadius={90}
                >
                  {catExpenses.map((c,i)=>(
                    <Cell key={i} fill={c.color}/>
                  ))}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* LISTA */}
        <div style={S.card}>
          <h2>Transações</h2>

          {txList.map(t => (

            <div
              key={t.id}
              style={{
                padding:"12px 0",
                borderBottom:`1px solid ${C.border}`,
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
              }}
            >

              <div>
                <div style={{fontWeight:600}}>
                  {t.desc}
                </div>

                <div style={{
                  fontSize:13,
                  color:C.textSub,
                }}>
                  {t.date}
                </div>
              </div>

              <div style={{
                display:"flex",
                alignItems:"center",
                gap:10,
              }}>

                <div style={{
                  color:t.type==="income"
                    ? C.emerald
                    : C.red,
                  fontWeight:700,
                }}>
                  {hideValues
                    ? "••••"
                    : (t.type==="income" ? "+" : "-") + fmt(t.amount)}
                </div>

                <button
                  onClick={()=>deleteTx(t.id)}
                  style={{
                    background:"none",
                    border:"none",
                    color:C.red,
                    cursor:"pointer",
                  }}
                >
                  <Trash2 size={18}/>
                </button>

              </div>

            </div>

          ))}
        </div>

      </main>

    </div>
  );
}