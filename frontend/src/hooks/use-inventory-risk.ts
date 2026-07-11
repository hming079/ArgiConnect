import { useQuery } from "@tanstack/react-query";

import {
  getInventoryRiskForecast,
  getInventoryRiskSummary,
  type InventoryRiskFilters,
} from "@/api/inventoryRiskApi";

const key = ["inventory-risk-forecast"];

export function useInventoryRiskForecast(filters: InventoryRiskFilters = {}) {
  return useQuery({
    queryKey: [...key, "list", filters],
    queryFn: () => getInventoryRiskForecast(filters),
  });
}

export function useInventoryRiskSummary() {
  return useQuery({
    queryKey: [...key, "summary"],
    queryFn: getInventoryRiskSummary,
  });
}
