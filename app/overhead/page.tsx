"use client";
import { useEffect, useState } from "react";
import { store, calcTrueCost, fmt } from "@/lib/store";
import { Overhead, Product } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

export default function OverheadPage() {
  const [overhead, setOverhead] = useState<Overhead>({ rent: 0, fuel: 0, wages: 0, fees: 0, updatedAt: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOverhead(store.getOverhead());
    setProducts(store.getProducts());
  }, []);

  function save() {
    store.saveOverhead({ ...overhead, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const total = overhead.rent + overhead.fuel + overhead.wages + overhead.fees;
  const totalVolume = products.reduce((s, p) => s + p.monthlyVolume, 0);

  const F = (label: string, field: keyof Omit<Overhead, "updatedAt">, hint: string) => (
    <div style={{ marginBottom: 16 }}>
      <label className="label">{label}</label>
      <input type="number" placeholder={hint}
        value={(overhead[field] as number) || ""}
        onChange={e => setOverhead(prev => ({ ...prev, [field]: +e.target.value }))} />
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <span style={{ fontSize: 24 }}>⚙️</span>
        <h1 className="page-title">Monthly Overhead</h1>
      </div>

      <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        These fixed costs are distributed proportionally across your products based on sales volume. Update them monthly.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        {F("Shop Rent / Stall Fee (₦/month)", "rent", "e.g. 15,000")}
        {F("Generator Fuel (₦/month)", "fuel", "e.g. 8,000")}
        {F("Wages / Staff (₦/month)", "wages", "e.g. 30,000")}
        {F("Bank charges, market dues, other (₦/month)", "fees", "e.g. 2,500")}

        {total > 0 && (
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>Total Monthly Overhead</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#10b981" }}>{fmt(total)}</div>
            {overhead.updatedAt && (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Last updated: {new Date(overhead.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            )}
          </div>
        )}

        {saved && (
          <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 8, padding: "10px 12px", marginBottom: 10, color: "#4ade80", fontSize: 14, fontWeight: 600 }}>
            ✓ Overhead saved. All product costs recalculated.
          </div>
        )}

        <button className="btn-primary" onClick={save}>Save Overhead</button>
      </div>

      {/* How it's allocated */}
      {products.length > 0 && total > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>How it's allocated</div>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
            Each product's overhead share = its % of total monthly units sold × total overhead.
          </p>
          {products.map(p => {
            const share = totalVolume > 0 ? (p.monthlyVolume / totalVolume) * total : 0;
            const perUnit = p.monthlyVolume > 0 ? share / p.monthlyVolume : 0;
            const pct = totalVolume > 0 ? (p.monthlyVolume / totalVolume) * 100 : 0;
            const b = calcTrueCost(p, overhead, products);
            return (
              <div key={p.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{pct.toFixed(0)}% of sales</div>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 6, height: 6, marginBottom: 8 }}>
                  <div style={{ background: "#3b82f6", height: 6, borderRadius: 6, width: `${pct}%` }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                  <div>
                    <div style={{ color: "#94a3b8" }}>Monthly share</div>
                    <div style={{ fontWeight: 700 }}>{fmt(share)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#94a3b8" }}>Per unit</div>
                    <div style={{ fontWeight: 700, color: "#f59e0b" }}>{fmt(perUnit)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#94a3b8" }}>True cost</div>
                    <div style={{ fontWeight: 700, color: b.profitable ? "#10b981" : "#ef4444" }}>{fmt(b.trueCost)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {products.length === 0 && (
        <div className="card" style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
          Add products from the Home tab to see overhead allocation.
        </div>
      )}

      <BottomNav />
    </div>
  );
}
