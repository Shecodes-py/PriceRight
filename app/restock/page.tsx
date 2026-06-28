"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { store, calcTrueCost, fmt } from "@/lib/store";
import { Product, Restock, Overhead } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

function uid() { return Math.random().toString(36).slice(2, 10); }

interface ProfitAlert {
  product: Product;
  oldSupplierCost: number;
  newSupplierCost: number;
  oldMargin: number;
  newMargin: number;
  suggestedPrice: number;
  trueCost: number;
}

function RestockContent() {
  const params = useSearchParams();
  const preselectedId = params.get("productId") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [overhead, setOverhead] = useState<Overhead>({ rent: 0, fuel: 0, wages: 0, fees: 0, updatedAt: "" });
  const [restocks, setRestocks] = useState<Restock[]>([]);
  const [selectedId, setSelectedId] = useState(preselectedId);
  const [newCost, setNewCost] = useState("");
  const [note, setNote] = useState("");
  const [alert, setAlert] = useState<ProfitAlert | null>(null);

  useEffect(() => {
    setProducts(store.getProducts());
    setOverhead(store.getOverhead());
    setRestocks(store.getRestocks());
    if (preselectedId) setSelectedId(preselectedId);
  }, [preselectedId]);

  const selected = products.find(p => p.id === selectedId);
  const threshold = store.getAlertThreshold();

  // Live preview of impact as user types new cost
  const livePreview = (() => {
    if (!selected || !newCost || +newCost === selected.supplierCost) return null;
    const oldBreak = calcTrueCost(selected, overhead, products);
    const hypothetical = { ...selected, supplierCost: +newCost };
    const newBreak = calcTrueCost(hypothetical, overhead, products);
    const suggestedPrice = newBreak.trueCost / (1 - threshold / 100);
    return { oldMargin: oldBreak.margin, newMargin: newBreak.margin, trueCost: newBreak.trueCost, suggestedPrice };
  })();

  function logRestock() {
    if (!selectedId || !newCost || !selected) return;

    const oldBreak = calcTrueCost(selected, overhead, products);
    const r: Restock = {
      id: uid(), productId: selectedId, date: new Date().toISOString(),
      newSupplierCost: +newCost, note: note || undefined,
    };
    store.addRestock(r);

    const updatedProducts = store.getProducts();
    const updatedProduct = updatedProducts.find(p => p.id === selectedId)!;
    const newBreak = calcTrueCost(updatedProduct, overhead, updatedProducts);
    const suggestedPrice = newBreak.trueCost / (1 - threshold / 100);

    setProducts(updatedProducts);
    setRestocks(store.getRestocks());
    setNewCost("");
    setNote("");
    setAlert({
      product: updatedProduct,
      oldSupplierCost: selected.supplierCost,
      newSupplierCost: +newCost,
      oldMargin: oldBreak.margin,
      newMargin: newBreak.margin,
      suggestedPrice,
      trueCost: newBreak.trueCost,
    });
  }

  function updateSellingPrice(price: number) {
    if (!alert) return;
    store.saveProduct({ ...alert.product, sellingPrice: price });
    setProducts(store.getProducts());
    setAlert(null);
  }

  const productRestocks = restocks.filter(r => r.productId === selectedId).slice(0, 5);

  return (
    <div className="page">
      <div className="page-header">
        <span style={{ fontSize: 24 }}>📦</span>
        <h1 className="page-title">Log Restock</h1>
      </div>

      {/* Profit Impact Alert — shown after logging */}
      {alert && (
        <div style={{
          background: alert.newMargin < 0 ? "#450a0a" : alert.newMargin < threshold ? "#451a03" : "#052e16",
          border: `1px solid ${alert.newMargin < 0 ? "#7f1d1d" : alert.newMargin < threshold ? "#78350f" : "#166534"}`,
          borderRadius: 14, padding: "16px", marginBottom: 16,
        }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
            {alert.newMargin < 0 ? "🚨 Selling at a loss" : alert.newMargin < threshold ? "⚠️ Margin squeezed" : "✅ Margin still healthy"}
          </div>
          <div style={{ fontSize: 14, color: "#cbd5e1", marginBottom: 12, lineHeight: 1.5 }}>
            Supplier cost rose {fmt(alert.oldSupplierCost)} → {fmt(alert.newSupplierCost)}.{" "}
            Your price of <strong>{fmt(alert.product.sellingPrice)}</strong> now gives only{" "}
            <strong style={{ color: alert.newMargin < threshold ? "#f87171" : "#4ade80" }}>
              {alert.newMargin.toFixed(1)}% margin
            </strong>{" "}
            (was {alert.oldMargin.toFixed(1)}%).
          </div>

          {(alert.newMargin < threshold) && (
            <>
              <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>PRICE ACTION NEEDED</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "#94a3b8" }}>
                  <span>True cost (incl. overhead)</span>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{fmt(alert.trueCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94a3b8" }}>
                  <span>Suggested minimum price ({threshold}% margin)</span>
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: 16 }}>{fmt(alert.suggestedPrice)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{ flex: 1, background: "#10b981", color: "#0f172a", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14 }}
                  onClick={() => updateSellingPrice(Math.ceil(alert.suggestedPrice / 100) * 100)}>
                  Set to {fmt(Math.ceil(alert.suggestedPrice / 100) * 100)} →
                </button>
                <button
                  style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", fontSize: 14 }}
                  onClick={() => setAlert(null)}>
                  Later
                </button>
              </div>
            </>
          )}
          {alert.newMargin >= threshold && (
            <button style={{ background: "#1e293b", color: "#4ade80", border: "1px solid #166534", borderRadius: 10, padding: "10px 16px", fontSize: 14, width: "100%" }}
              onClick={() => setAlert(null)}>
              Got it ✓
            </button>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Product</label>
          <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setAlert(null); }}>
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

        {/* Live margin preview */}
        {livePreview && (
          <div style={{
            background: "#0f172a", borderRadius: 10, padding: "12px", marginBottom: 14,
            border: `1px solid ${livePreview.newMargin < 0 ? "#7f1d1d" : livePreview.newMargin < threshold ? "#78350f" : "#166534"}`,
          }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Margin preview</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#94a3b8" }}>Before restock</span>
              <span style={{ color: "#94a3b8" }}>{livePreview.oldMargin.toFixed(1)}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: "#94a3b8" }}>After restock</span>
              <span style={{ color: livePreview.newMargin < 0 ? "#ef4444" : livePreview.newMargin < threshold ? "#f59e0b" : "#10b981" }}>
                {livePreview.newMargin.toFixed(1)}%
                {livePreview.newMargin < threshold && ` → raise to ${fmt(livePreview.suggestedPrice)}`}
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label className="label">Note (optional)</label>
          <input placeholder="e.g. Balogun market, supplier raised price" value={note}
            onChange={e => setNote(e.target.value)} />
        </div>

        <button className="btn-primary"
          style={{ opacity: selectedId && newCost ? 1 : 0.5 }}
          onClick={logRestock}>
          Log Restock
        </button>
      </div>

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
