import axiosClient from "./axiosClient";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ForecastInventoryPoint {
  days: number;
  currentInventory: number;
  expectedHarvest: number;
  expectedConsumption: number;
  forecastInventory: number;
}

export interface AnalyticsOverview {
  totalProductionQuantity: number;
  currentInventoryQuantity: number;
  soldQuantity: number;
  rescuingQuantity: number;
  inTransitQuantity: number;
  rescueSuccessRate: number;
  averageDailyConsumption: number;
  inventoryCoverageDays: number;
  harvestIncomingQuantity: number;
  availableSupply: number;
  shipmentCompletionRate: number;
  averageDeliveryTime: number;
  congestionRiskScore: number;
  congestionRiskLevel: RiskLevel;
  forecastInventory: ForecastInventoryPoint[];
}

export interface ProvinceStat {
  province: string;
  totalKg: number;
  inventoryKg: number;
  rescuingKg: number;
  consumedKg: number;
  inTransitKg: number;
  consumptionRateKgPerDay: number;
  rescueSuccessRate: number;
  inventoryCoverageDays: number;
  harvestIncomingKg: number;
  availableSupplyKg: number;
  congestionRiskScore: number;
  congestionRiskLevel: RiskLevel;
}

export interface RescueRateRow {
  group: "province" | "crop" | "rescuePoint";
  name: string;
  rescuedQuantity: number;
  totalQuantity: number;
  rate: number;
}

export interface SupplyCapacityRow {
  province: string;
  days: number;
  dailyHarvestKg: number;
  immediateKg: number;
  incomingHarvestKg: number;
  expectedConsumptionKg: number;
  totalSupplyKg: number;
  netAvailableKg: number;
}

export interface CongestionRiskRow {
  province: string;
  cropName: string;
  currentInventory: number;
  incomingHarvest: number;
  averageDailyConsumption: number;
  maxStorageDays: number;
  earliestExpiryDate: string | null;
  rescueSuccessRate: number;
  riskScore: number;
  riskLevel: RiskLevel;
  recommendation: string;
}

export interface ForecastInventoryResponse {
  days: number;
  currentInventory: number;
  averageDailyHarvest: number;
  expectedHarvest: number;
  averageDailyConsumption: number;
  expectedConsumption: number;
  forecastInventory: number;
  points: ForecastInventoryPoint[];
}

export type RescueRateGroupBy = "province" | "crop" | "rescuePoint";

export async function getAnalyticsOverview() {
  return (await axiosClient.get<AnalyticsOverview>("/analytics/overview")).data;
}

export async function getProvinceStats() {
  return (await axiosClient.get<ProvinceStat[]>("/analytics/province-stats")).data;
}

export async function getRescueRates(groupBy: RescueRateGroupBy) {
  return (
    await axiosClient.get<RescueRateRow[]>("/analytics/rescue-rates", { params: { groupBy } })
  ).data;
}

export async function getSupplyCapacity(params: {
  startDate?: string;
  endDate?: string;
  province?: string;
}) {
  return (await axiosClient.get<SupplyCapacityRow[]>("/analytics/supply-capacity", { params }))
    .data;
}

export async function getCongestionRisk() {
  return (await axiosClient.get<CongestionRiskRow[]>("/analytics/congestion-risk")).data;
}

export async function getForecastInventory(days: 7 | 14 | 30 = 7) {
  return (
    await axiosClient.get<ForecastInventoryResponse>("/analytics/forecast-inventory", {
      params: { days },
    })
  ).data;
}
