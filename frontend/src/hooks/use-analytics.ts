import { useQuery } from "@tanstack/react-query";

import {
  getAnalyticsOverview,
  getCongestionRisk,
  getForecastInventory,
  getProvinceStats,
  getRescueRates,
  getSupplyCapacity,
  type RescueRateGroupBy,
} from "@/api/analyticsApi";

const key = ["analytics"];

export function useAnalyticsOverview() {
  return useQuery({ queryKey: [...key, "overview"], queryFn: getAnalyticsOverview });
}

export function useProvinceStats() {
  return useQuery({ queryKey: [...key, "province-stats"], queryFn: getProvinceStats });
}

export function useRescueRates(groupBy: RescueRateGroupBy, enabled = true) {
  return useQuery({
    queryKey: [...key, "rescue-rates", groupBy],
    queryFn: () => getRescueRates(groupBy),
    enabled,
  });
}

export function useSupplyCapacity(
  params: {
    startDate?: string;
    endDate?: string;
    province?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: [...key, "supply-capacity", params],
    queryFn: () => getSupplyCapacity(params),
    enabled,
  });
}

export function useCongestionRisk() {
  return useQuery({ queryKey: [...key, "congestion-risk"], queryFn: getCongestionRisk });
}

export function useForecastInventory(days: 7 | 14 | 30 = 7) {
  return useQuery({
    queryKey: [...key, "forecast-inventory", days],
    queryFn: () => getForecastInventory(days),
  });
}
