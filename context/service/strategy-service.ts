import { Pool } from 'pg';
import { Strategy } from '../../types';

interface DBStrategy {
  yield_description: string;
  strategy_apr: number;
  ma7_strategy_apr: number;
  ma30_strategy_apr: number;
  max_ltv: number;
  utilization: number;
  supply: number;
  debt_token: string;
  lending_description: string;
  last_updated: Date;
  lending_id: string;
  rn: number;
}

export class StrategyService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  private mapDBtoStrategy(dbStrategy: DBStrategy): Strategy {
    return {
      id: dbStrategy.lending_id,
      name: dbStrategy.yield_description,
      apr30d: Number(dbStrategy.ma30_strategy_apr),
      apr7d: Number(dbStrategy.ma7_strategy_apr),
      apr1d: Number(dbStrategy.strategy_apr),
      lltv: Number(dbStrategy.max_ltv),
      utilization: Number(dbStrategy.utilization),
      totalSupply: Number(dbStrategy.supply),
      debtToken: dbStrategy.debt_token,
      description: dbStrategy.lending_description,
      lastUpdated: dbStrategy.last_updated
    };
  }

  async getAllStrategies(): Promise<Strategy[]> {
    try {
      const result = await this.pool.query<DBStrategy>(
        'SELECT * FROM leveraged_strategies WHERE rn IS NOT NULL ORDER BY ma30_strategy_apr DESC'
      );

      return result.rows.map(row => this.mapDBtoStrategy(row));
    } catch (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }
  }

  async getStrategyById(id: string): Promise<Strategy | null> {
    try {
      const query = `
        SELECT * FROM leveraged_strategies 
        WHERE lending_id = $1
      `;
      const result = await this.pool.query<DBStrategy>(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDBtoStrategy(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching strategy by ID ${id}:`, error);
      throw error;
    }
  }
}
