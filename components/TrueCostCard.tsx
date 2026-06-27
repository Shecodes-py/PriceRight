"use client";
import { Product, Overhead } from "@/lib/types";
import { calcTrueCost, fmt } from "@/lib/store";

interface Props {
  product: Product;
  overhead: Overhead;
  allProducts: Product[];
  threshold: number;
  onDelete?: (id: string) => void;
  onRestock?: (product: Product) => void;
}

export default function TrueCostCard({ product, overhead, allProducts, threshold, onDelete, onRestock }: Props) {
  const b = calcTrueCost(product, overhead, allProducts);
  const atRisk = b.margin < threshold;
  const borderColor = !b.profitable ? "#ef4444" : atRisk ? "#f59e0b" : "#10b981";

  return (
    <div className="card" style={{ borderLeft: `4px solid ${borderColor}`, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{product.name}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{product.category}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: borderColor }}>
            {b.margin > 0 ? "+" : ""}{b.margin.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>margin</div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "#0f172a", borderRadius: 8, padding: "8px 10px" }}>
          <div className="label">True Cost</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#f1f5f9" }}>{fmt(b.trueCost)}</div>
        </div>
        <div style={{ background: "#0f172a", borderRadius: 8, padding: "8px 10px" }}>
          <div className="label">Selling Price</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#10b981" }}>{fmt(b.sellingPrice)}</div>
        </div>
      </div>

      {/* Cost breakdown */}
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 12, color: "#94a3b8", cursor: "pointer", listStyle: "none", userSelect: "none" }}>
          ▸ Cost breakdown
        </summary>
        <div style={{ marginTop: 8, fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            ["Supplier cost", b.supplierCost],
            ["Transport", b.transport],
            ["Packaging", b.packaging],
            ["Overhead share", b.overheadPerUnit],
          ].map(([label, val]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
              <span>{label}</span>
              <span>{fmt(val as number)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid #334155", paddingTop: 4, color: "#f1f5f9" }}>
            <span>True Cost</span>
            <span>{fmt(b.trueCost)}</span>
          </div>
        </div>
      </details>

      {(!b.profitable || atRisk) && (
        <div style={{
          marginTop: 10, background: !b.profitable ? "#450a0a" : "#451a03",
          border: `1px solid ${!b.profitable ? "#7f1d1d" : "#78350f"}`,
          borderRadius: 8, padding: "8px 10px", fontSize: 13,
        }}>
          {!b.profitable
            ? `⚠️ You are losing ${fmt(b.trueCost - b.sellingPrice)} per unit. Minimum price: ${fmt(b.trueCost * 1.1)}`
            : `⚠️ Margin below ${threshold}% target. Consider raising to ${fmt(b.trueCost / (1 - threshold / 100))}`
          }
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {onRestock && (
          <button className="btn-secondary" style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
            onClick={() => onRestock(product)}>
            Log Restock
          </button>
        )}
        {onDelete && (
          <button style={{ background: "#450a0a", color: "#fca5a5", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
            onClick={() => { if (confirm(`Delete "${product.name}"?`)) onDelete(product.id); }}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
