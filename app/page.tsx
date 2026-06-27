"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { store, calcTrueCost, fmt, CATEGORIES } from "@/lib/store";
import { Product, Overhead } from "@/lib/types";
import TrueCostCard from "@/components/TrueCostCard";
import BottomNav from "@/components/BottomNav";

function uid() { return Math.random().toString(36).slice(2, 10); }

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [overhead, setOverhead] = useState<Overhead>({ rent: 0, fuel: 0, wages: 0, fees: 0, updatedAt: "" });
  const [threshold, setThreshold] = useState(20);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", category: CATEGORIES[0], sellingPrice: "", supplierCost: "",
    transport: "", packaging: "", monthlyVolume: "",
  });

  useEffect(() => {
    if (!store.isOnboarded()) { router.replace("/onboard"); return; }
    setProducts(store.getProducts());
    setOverhead(store.getOverhead());
    setThreshold(store.getAlertThreshold());
  }, [router]);

  function refresh() {
    setProducts(store.getProducts());
    setOverhead(store.getOverhead());
  }

  function addProduct() {
    if (!form.name || !form.sellingPrice || !form.supplierCost) return;
    const p: Product = {
      id: uid(), name: form.name, category: form.category,
      sellingPrice: +form.sellingPrice, supplierCost: +form.supplierCost,
      transport: +(form.transport || 0), packaging: +(form.packaging || 0),
      monthlyVolume: +(form.monthlyVolume || 1), createdAt: new Date().toISOString(),
    };
    store.saveProduct(p);
    refresh();
    setForm({ name: "", category: CATEGORIES[0], sellingPrice: "", supplierCost: "", transport: "", packaging: "", monthlyVolume: "" });
    setShowAdd(false);
  }

  const alerts = products.filter(p => {
    const b = calcTrueCost(p, overhead, products);
    return !b.profitable || b.margin < threshold;
  });

  const totalOverhead = overhead.rent + overhead.fuel + overhead.wages + overhead.fees;

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#10b981" }}>PriceRight</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Know your true cost</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Alert below</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" value={threshold} min={0} max={100}
              style={{ width: 52, textAlign: "center", padding: "4px 6px", fontSize: 14 }}
              onChange={e => { setThreshold(+e.target.value); store.setAlertThreshold(+e.target.value); }} />
            <span style={{ fontSize: 13, color: "#94a3b8" }}>% margin</span>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{
          background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12,
          padding: "12px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: "#fca5a5", fontSize: 14 }}>
              {alerts.length} product{alerts.length > 1 ? "s" : ""} need attention
            </div>
            <div style={{ fontSize: 13, color: "#f87171" }}>
              {alerts.map(p => p.name).join(", ")}
            </div>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div className="card" style={{ textAlign: "center", padding: "10px 8px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{products.length}</div>
            <div className="label" style={{ marginBottom: 0 }}>Products</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "10px 8px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>{alerts.length}</div>
            <div className="label" style={{ marginBottom: 0 }}>Alerts</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "10px 8px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>
              {totalOverhead > 0 ? fmt(totalOverhead) : "—"}
            </div>
            <div className="label" style={{ marginBottom: 0 }}>Overhead</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Your Products</div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ background: "#10b981", color: "#0f172a", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>
          {showAdd ? "✕ Cancel" : "+ Add"}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>New Product</div>
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
              <label className="label">Units/mo</label>
              <input type="number" placeholder="1" value={form.monthlyVolume}
                onChange={e => setForm(p => ({ ...p, monthlyVolume: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary"
            style={{ opacity: form.name && form.sellingPrice && form.supplierCost ? 1 : 0.5 }}
            onClick={addProduct}>
            Add Product
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No products yet</div>
          <div style={{ fontSize: 14 }}>Add your first product to see your true margin.</div>
        </div>
      ) : (
        products.map(p => (
          <TrueCostCard key={p.id} product={p} overhead={overhead} allProducts={products}
            threshold={threshold}
            onDelete={id => { store.deleteProduct(id); refresh(); }}
            onRestock={prod => router.push(`/restock?productId=${prod.id}`)} />
        ))
      )}

      <BottomNav />
    </div>
  );
}
