export interface SimulationDataPoint {
  time: string; 
  realLatency: number;
  predictedLatency: number;
}

export interface LatencyComparisonResponse {
  configId: string;
  url: string;
  networkProfile: string; 
  series: SimulationDataPoint[];
}
