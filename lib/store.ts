"use client";
import { Product, Overhead, Restock, TrueCostBreakdown, BenchmarkData } from "./types";

const KEYS = {
  products: "pr_products",
  overhead: "pr_overhead",
  restocks: "pr_restocks",
  alertThreshold: "pr_alert_threshold",
  onboarded: "pr_onboarded",
};

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  isOnboarded: () => get<boolean>(KEYS.onboarded, false),
  setOnboarded: () => set(KEYS.onboarded, true),

  getProducts: () => get<Product[]>(KEYS.products, []),
  saveProduct: (p: Product) => {
    const products = store.getProducts().filter((x) => x.id !== p.id);
    set(KEYS.products, [...products, p]);
  },
  deleteProduct: (id: string) => {
    set(KEYS.products, store.getProducts().filter((p) => p.id !== id));
  },

  getOverhead: (): Overhead =>
    get<Overhead>(KEYS.overhead, { rent: 0, fuel: 0, wages: 0, fees: 0, updatedAt: "" }),
  saveOverhead: (o: Overhead) => set(KEYS.overhead, o),

  getRestocks: () => get<Restock[]>(KEYS.restocks, []),
  addRestock: (r: Restock) => {
    const restocks = store.getRestocks();
    set(KEYS.restocks, [r, ...restocks]);
    // Update product supplier cost
    const products = store.getProducts();
    const product = products.find((p) => p.id === r.productId);
    if (product) {
      store.saveProduct({ ...product, supplierCost: r.newSupplierCost });
    }
  },

  getAlertThreshold: () => get<number>(KEYS.alertThreshold, 20),
  setAlertThreshold: (n: number) => set(KEYS.alertThreshold, n),
};

export function calcTrueCost(product: Product, overhead: Overhead, allProducts: Product[]): TrueCostBreakdown {
  const totalOverhead = overhead.rent + overhead.fuel + overhead.wages + overhead.fees;
  const totalVolume = allProducts.reduce((s, p) => s + p.monthlyVolume, 0);
  const overheadShare = totalVolume > 0 ? (product.monthlyVolume / totalVolume) * totalOverhead : 0;
  const overheadPerUnit = product.monthlyVolume > 0 ? overheadShare / product.monthlyVolume : 0;

  const trueCost = product.supplierCost + product.transport + product.packaging + overheadPerUnit;
  const margin = product.sellingPrice > 0 ? ((product.sellingPrice - trueCost) / product.sellingPrice) * 100 : -100;

  return {
    supplierCost: product.supplierCost,
    transport: product.transport,
    packaging: product.packaging,
    overheadPerUnit,
    trueCost,
    sellingPrice: product.sellingPrice,
    margin,
    profitable: margin > 0,
  };
}

// Seeded benchmark data (NBS-inspired price ranges for Lagos market, 2025)
const BENCHMARK_SEED: BenchmarkData[] = [
  { category: "Food & Groceries", min: 800, median: 2500, max: 8000, sampleSize: 412 },
  { category: "Fabric & Clothing", min: 3500, median: 12000, max: 45000, sampleSize: 187 },
  { category: "Cosmetics & Beauty", min: 1200, median: 4500, max: 18000, sampleSize: 293 },
  { category: "Household Items", min: 500, median: 3200, max: 15000, sampleSize: 341 },
  { category: "Electronics & Accessories", min: 2000, median: 8500, max: 55000, sampleSize: 156 },
  { category: "Snacks & Baked Goods", min: 200, median: 800, max: 3500, sampleSize: 524 },
  { category: "Drinks & Beverages", min: 300, median: 1200, max: 5000, sampleSize: 389 },
  { category: "Stationery & Office", min: 150, median: 900, max: 4500, sampleSize: 210 },
  { category: "Jewelry & Accessories", min: 1500, median: 6000, max: 35000, sampleSize: 142 },
  { category: "Other", min: 500, median: 3000, max: 20000, sampleSize: 88 },
];

export function getBenchmarkForCategory(category: string): BenchmarkData {
  return BENCHMARK_SEED.find((b) => b.category === category) ?? BENCHMARK_SEED[BENCHMARK_SEED.length - 1];
}

export const CATEGORIES = BENCHMARK_SEED.map((b) => b.category);

export function fmt(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}
