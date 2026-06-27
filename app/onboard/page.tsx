"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { store, CATEGORIES, fmt } from "@/lib/store";
import { Product, Overhead } from "@/lib/types";

function uid() { return Math.random().toString(36).slice(2, 10); }

const STEPS = ["Welcome", "Overhead", "Products", "Done"];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Overhead state
  const [overhead, setOverhead] = useState<Overhead>({ rent: 0, fuel: 0, wages: 0, fees: 0, updatedAt: "" });

  // Product form
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    name: "", category: CATEGORIES[0], sellingPrice: "", supplierCost: "", transport: "", packaging: "", monthlyVolume: "",
  });

  function addProduct() {
    if (!form.name || !form.sellingPrice || !form.supplierCost) return;
    setProducts(prev => [...prev, {
      id: uid(), name: form.name, category: form.category,
      sellingPrice: +form.sellingPrice, supplierCost: +form.supplierCost,
      transport: +(form.transport || 0), packaging: +(form.packaging || 0),
      monthlyVolume: +(form.monthlyVolume || 1), createdAt: new Date().toISOString(),
    }]);
    setForm({ name: "", category: CATEGORIES[0], sellingPrice: "", supplierCost: "", transport: "", packaging: "", monthlyVolume: "" });
  }

  function finish() {
    const oh: Overhead = { ...overhead, updatedAt: new Date().toISOString() };
    store.saveOverhead(oh);
    products.forEach(p => store.saveProduct(p));
    store.setOnboarded();
    router.push("/");
  }

  const N = (label: string, field: keyof typeof overhead, placeholder?: string) => (
    <div style={{ marginBottom: 14 }}>
      <label className="label">{label}</label>
      <input type="number" placeholder={placeholder ?? "0"} value={(overhead[field] as number) || ""}
        onChange={e => setOverhead(prev => ({ ...prev, [field]: +e.target.value }))} />
    </div>
  );

  const totalOverhead = overhead.rent + overhead.fuel + overhead.wages + overhead.fees;

  if (step === 0) return (
    <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minHeight: "100dvh" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>💰</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>PriceRight</h1>
      <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 8, lineHeight: 1.5 }}>
        Know your <strong style={{ color: "#10b981" }}>true cost</strong>.<br />Price with confidence.
      </p>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 40, lineHeight: 1.6 }}>
        Stop losing money by underpricing. PriceRight calculates your real margin — including rent, fuel, and wages — and alerts you before your prices fall below profit.
      </p>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn-primary" onClick={() => setStep(1)}>Get Started (5 min)</button>
        <button className="btn-secondary" onClick={() => { store.setOnboarded(); router.push("/"); }}>
          Skip setup →
        </button>
      </div>
    </div>
  );

  if (step === 1) return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Step 1 of 2</div>
        <h2 className="page-title">Monthly Overhead</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
          These fixed costs are shared across all your products proportionally.
        </p>
      </div>
      {N("Shop Rent / Stall Fee (₦/month)", "rent", "e.g. 15000")}
      {N("Generator Fuel (₦/month)", "fuel", "e.g. 8000")}
      {N("Wages / Staff (₦/month)", "wages", "e.g. 30000")}
      {N("Bank charges, market dues, other (₦/month)", "fees", "e.g. 2500")}
      {totalOverhead > 0 && (
        <div className="card" style={{ borderColor: "#10b981", marginBottom: 16 }}>
          <div className="label">Total Monthly Overhead</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{fmt(totalOverhead)}</div>
        </div>
      )}
      <button className="btn-primary" onClick={() => setStep(2)}>Continue →</button>
    </div>
  );

  if (step === 2) return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Step 2 of 2</div>
        <h2 className="page-title">Your Products</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
          Add your top-selling products. You can add more later.
        </p>
      </div>

      {products.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Selling: {fmt(p.sellingPrice)} · Cost: {fmt(p.supplierCost)}</div>
              </div>
              <button style={{ background: "#450a0a", color: "#fca5a5", borderRadius: 6, padding: "4px 10px", fontSize: 12 }}
                onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Add a Product</div>
        <div style={{ marginBottom: 10 }}>
          <label className="label">Product Name</label>
          <input placeholder="e.g. Ankara fabric (per yard)" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label className="label">Category</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label className="label">Selling Price (₦)</label>
            <input type="number" placeholder="e.g. 12000" value={form.sellingPrice}
              onChange={e => setForm(p => ({ ...p, sellingPrice: e.target.value }))} />
          </div>
          <div>
            <label className="label">Supplier Cost (₦)</label>
            <input type="number" placeholder="e.g. 9500" value={form.supplierCost}
              onChange={e => setForm(p => ({ ...p, supplierCost: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label className="label">Transport (₦)</label>
            <input type="number" placeholder="0" value={form.transport}
              onChange={e => setForm(p => ({ ...p, transport: e.target.value }))} />
          </div>
          <div>
            <label className="label">Packaging (₦)</label>
            <input type="number" placeholder="0" value={form.packaging}
              onChange={e => setForm(p => ({ ...p, packaging: e.target.value }))} />
          </div>
          <div>
            <label className="label">Units/month</label>
            <input type="number" placeholder="1" value={form.monthlyVolume}
              onChange={e => setForm(p => ({ ...p, monthlyVolume: e.target.value }))} />
          </div>
        </div>
        <button className="btn-secondary"
          style={{ opacity: form.name && form.sellingPrice && form.supplierCost ? 1 : 0.5 }}
          onClick={addProduct}>
          + Add Product
        </button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-secondary" style={{ flex: "none", width: "auto", padding: "12px 20px" }}
          onClick={() => setStep(1)}>← Back</button>
        <button className="btn-primary"
          style={{ opacity: products.length > 0 ? 1 : 0.5 }}
          onClick={products.length > 0 ? finish : undefined}>
          Finish Setup →
        </button>
      </div>
    </div>
  );

  return null;
}
