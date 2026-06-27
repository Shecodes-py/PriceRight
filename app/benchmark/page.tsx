"use client";
import { useEffect, useState } from "react";
import { store, getBenchmarkForCategory, fmt, CATEGORIES } from "@/lib/store";
import { Product } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

export default function BenchmarkPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    setProducts(store.getProducts());
  }, []);

  const benchmark = getBenchmarkForCategory(selectedCategory);

  // Find user's products in this category
  const myProducts = products.filter(p => p.category === selectedCategory);

  function positionLabel(price: number, min: number, max: number): string {
    if (price < min) return "Below market";
    if (price > max) return "Above market";
    if (price < benchmark.median * 0.9) return "Below median";
    if (price > benchmark.median * 1.1) return "Above median";
    return "Near median";
  }

  function positionColor(price: number, min: number, max: number): string {
    if (price < min) return "#ef4444";
    if (price < benchmark.median * 0.9) return "#f59e0b";
    if (price > max) return "#3b82f6";
    return "#10b981";
  }

  function barPosition(price: number): number {
    const range = benchmark.max - benchmark.min;
    return Math.max(0, Math.min(100, ((price - benchmark.min) / range) * 100));
  }

  return (
    <div className="page">
      <div className="page-header">
        <span style={{ fontSize: 24 }}>📊</span>
        <h1 className="page-title">Market Benchmark</h1>
      </div>

      <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
        See where your prices sit relative to real sellers in Lagos. Data sourced from NBS price surveys and crowdsourced seller data.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label className="label">Category</label>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Benchmark bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedCategory}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{benchmark.sampleSize} sellers</div>
        </div>

        <div style={{ position: "relative", marginTop: 20, marginBottom: 20 }}>
          {/* Track */}
          <div style={{ height: 8, background: "#0f172a", borderRadius: 4, position: "relative" }}>
            {/* Range fill */}
            <div style={{
              position: "absolute", top: 0, height: 8, background: "linear-gradient(90deg, #1d4ed8, #10b981, #f59e0b)",
              borderRadius: 4, left: 0, right: 0,
            }} />
            {/* Median marker */}
            <div style={{
              position: "absolute", top: -4, width: 2, height: 16, background: "#f1f5f9",
              left: `${barPosition(benchmark.median)}%`, transform: "translateX(-50%)",
            }} />
          </div>

          {/* Labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
            <div>Min<br /><span style={{ color: "#f1f5f9", fontWeight: 700 }}>{fmt(benchmark.min)}</span></div>
            <div style={{ textAlign: "center" }}>Median<br /><span style={{ color: "#f1f5f9", fontWeight: 700 }}>{fmt(benchmark.median)}</span></div>
            <div style={{ textAlign: "right" }}>Max<br /><span style={{ color: "#f1f5f9", fontWeight: 700 }}>{fmt(benchmark.max)}</span></div>
          </div>
        </div>

        {/* My products on the benchmark */}
        {myProducts.length > 0 && (
          <div style={{ borderTop: "1px solid #334155", paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>YOUR PRODUCTS</div>
            {myProducts.map(p => {
              const color = positionColor(p.sellingPrice, benchmark.min, benchmark.max);
              const pos = barPosition(p.sellingPrice);
              const label = positionLabel(p.sellingPrice, benchmark.min, benchmark.max);
              return (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color, fontWeight: 700 }}>{fmt(p.sellingPrice)}</span>
                  </div>
                  <div style={{ position: "relative", height: 6, background: "#0f172a", borderRadius: 3 }}>
                    <div style={{
                      position: "absolute", top: -3, width: 12, height: 12, borderRadius: "50%",
                      background: color, left: `${pos}%`, transform: "translateX(-50%)",
                      border: "2px solid #1e293b",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color, marginTop: 4 }}>{label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Floor Price", value: fmt(benchmark.min), color: "#3b82f6" },
          { label: "Market Median", value: fmt(benchmark.median), color: "#10b981" },
          { label: "Top Price", value: fmt(benchmark.max), color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: "center", padding: "10px 8px" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color }}>{value}</div>
            <div className="label" style={{ marginBottom: 0 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* All products summary */}
      {products.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>All Your Products</div>
          {products.map(p => {
            const b = getBenchmarkForCategory(p.category);
            const color = positionColor(p.sellingPrice, b.min, b.max);
            const label = positionLabel(p.sellingPrice, b.min, b.max);
            return (
              <div key={p.id} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{p.category}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color }}>{fmt(p.sellingPrice)}</div>
                  <div style={{ fontSize: 11, color }}>{label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {products.length === 0 && (
        <div className="card" style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
          Add products from the Home tab to see how your prices compare.
        </div>
      )}

      <div style={{ marginTop: 16, padding: "12px 14px", background: "#0f172a", borderRadius: 10, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
        📌 Benchmark data sourced from NBS Consumer Price Index surveys and anonymized seller-reported prices across Lagos markets. Updated quarterly. {benchmark.sampleSize} active sellers in this category.
      </div>

      <BottomNav />
    </div>
  );
}
