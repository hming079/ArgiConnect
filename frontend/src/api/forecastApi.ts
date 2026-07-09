import axiosClient from "./axiosClient";

export interface ForecastResult {
  id: number;
  province: string;
  cropName: string;
  year: number;
  month: number;
  predictedQuantity: number;
  modelName: string;
  createdAt: string;
}

export interface ForecastFilters {
  province?: string;
  cropName?: string;
  year?: number;
  month?: number;
}

export interface ForecastImportResult {
  importedRows: number;
  sourcePath: string;
}

export interface ForecastClearResult {
  deletedRows: number;
}

export async function getForecasts(filters: ForecastFilters = {}) {
  return (await axiosClient.get<ForecastResult[]>("/forecasts", { params: filters })).data;
}

export async function importForecastCsv() {
  return (await axiosClient.post<ForecastImportResult>("/forecasts/import-csv")).data;
}

export async function importForecastDataset() {
  return (await axiosClient.post<ForecastImportResult>("/forecast-dataset/import-csv")).data;
}

export async function clearForecasts() {
  return (await axiosClient.delete<ForecastClearResult>("/forecasts")).data;
}

export async function clearForecastDataset() {
  return (await axiosClient.delete<ForecastClearResult>("/forecast-dataset")).data;
}
