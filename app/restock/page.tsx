"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { store, fmt } from "@/lib/store";
import { Product, Restock } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

function uid() { return Math.random().toString(36).slice(2, 10); }

function RestockContent() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedId = params.get("productId") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [restocks, setRestocks] = useState<Restock[]>([]);
  const [selectedId, setSelectedId] = useState(preselectedId);
  const [newCost, setNewCost] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProducts(store.getProducts());
    setRestocks(store.getRestocks());
    if (preselectedId) setSelectedId(preselectedId);
  }, [preselectedId]);

  const selected = products.find(p => p.id === selectedId);

  function logRestock() {
    if (!selectedId || !newCost) return;
    const r: Restock = {
      id: uid(), productId: selectedId, date: new Date().toISOString(),
      newSupplierCost: +newCost, note: note || undefined,
    };
    store.addRestock(r);
    setRestocks(store.getRestocks());
    setProducts(store.getProducts());
    setNewCost("");
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const productRestocks = restocks.filter(r => r.productId === selectedId).slice(0, 5);

  return (
    <div className="page">
      <div className="page-header">
        <span style={{ fontSize: 24 }}>📦</span>
        <h1 className="page-title">Log Restock</h1>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Product</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">— Select product —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selected && (
          <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#94a3b8" }}>Current supplier cost</span>
              <span style={{ fontWeight: 700, color: "#f59e0b" }}>{fmt(selected.supplierCost)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Current selling price</span>
              <span style={{ fontWeight: 700, color: "#10b981" }}>{fmt(selected.sellingPrice)}</span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label className="label">New Supplier Cost (₦)</label>
          <input type="number" placeholder="Enter new price from supplier"
            value={newCost} onChange={e => setNewCost(e.target.value)} />
          {selected && newCost && (
            <div style={{ marginTop: 6, fontSize: 13 }}>
              {+newCost > selected.supplierCost ? (
                <span style={{ color: "#ef4444" }}>
                  ↑ {fmt(+newCost - selected.supplierCost)} increase ({(((+newCost - selected.supplierCost) / selected.supplierCost) * 100).toFixed(1)}%)
                </span>
              ) : +newCost < selected.supplierCost ? (
                <span style={{ color: "#10b981" }}>
                  ↓ {fmt(selected.supplierCost - +newCost)} decrease
                </span>
              ) : (
                <span style={{ color: "#94a3b8" }}>No change</span>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="label">Note (optional)</label>
          <input placeholder="e.g. Balogun market, supplier raised price" value={note}
            onChange={e => setNote(e.target.value)} />
        </div>

        {saved && (
          <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 8, padding: "10px 12px", marginBottom: 10, color: "#4ade80", fontSize: 14, fontWeight: 600 }}>
            ✓ Restock logged. True cost updated.
          </div>
        )}

        <button className="btn-primary"
          style={{ opacity: selectedId && newCost ? 1 : 0.5 }}
          onClick={logRestock}>
          Log Restock
        </button>
      </div>

      {/* Recent restocks */}
      {restocks.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            {selectedId ? "Recent for this product" : "Recent Restocks"}
          </div>
          {(selectedId ? productRestocks : restocks.slice(0, 8)).map(r => {
            const prod = products.find(p => p.id === r.productId);
            return (
              <div key={r.id} className="card" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{prod?.name ?? "Unknown"}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {new Date(r.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    {r.note && ` · ${r.note}`}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: 16 }}>{fmt(r.newSupplierCost)}</div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function RestockPage() {
  return (
    <Suspense>
      <RestockContent />
    </Suspense>
  );
}
