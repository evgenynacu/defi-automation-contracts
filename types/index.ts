// Типы данных для стратегий
export interface Strategy {
  id: string;
  name: string;
  apr30d: number;
  apr7d: number;
  apr1d: number;
  lltv: number;
  utilization: number;
  totalSupply: number;
  debtToken: string;
  description: string;
  lastUpdated: Date;
}
