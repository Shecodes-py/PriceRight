export interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  supplierCost: number;
  transport: number;
  packaging: number;
  monthlyVolume: number; // units sold per month
  createdAt: string;
}

export interface Overhead {
  rent: number;
  fuel: number;
  wages: number;
  fees: number; // bank charges, market dues, etc.
  updatedAt: string;
}

export interface Restock {
  id: string;
  productId: string;
  date: string;
  newSupplierCost: number;
  note?: string;
}

export interface TrueCostBreakdown {
  supplierCost: number;
  transport: number;
  packaging: number;
  overheadPerUnit: number;
  trueCost: number;
  sellingPrice: number;
  margin: number; // percentage
  profitable: boolean;
}

export interface BenchmarkData {
  category: string;
  min: number;
  median: number;
  max: number;
  sampleSize: number;
}
