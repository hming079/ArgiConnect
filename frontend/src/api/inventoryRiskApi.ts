import axiosClient from "./axiosClient";
import type { RiskLevel } from "./analyticsApi";

export interface InventoryRiskResponse {
  batchId: number;
  cropName: string;
  province: string;
  currentQuantity: number;
  initialQuantity: number;
  harvestDate: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  estimatedDailySales: number;
  estimatedDaysToSellOut: number;
  riskScore: number;
  riskLevel: RiskLevel;
  explanation: string;
}

export interface InventoryRiskSummaryResponse {
  totalBatches: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRiskScore: number;
  topRiskProvince: string | null;
  topRiskCropName: string | null;
}

export interface InventoryRiskFilters {
  province?: string;
  cropName?: string;
  riskLevel?: RiskLevel;
}

export async function getInventoryRiskForecast(filters: InventoryRiskFilters = {}) {
  return (
    await axiosClient.get<InventoryRiskResponse[]>("/inventory-risk-forecast", {
      params: filters,
    })
  ).data;
}

export async function getInventoryRiskSummary() {
  return (await axiosClient.get<InventoryRiskSummaryResponse>("/inventory-risk-forecast/summary"))
    .data;
}
