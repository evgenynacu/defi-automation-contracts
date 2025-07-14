import { Pool } from 'pg';
import { Strategy } from '../../types';

/**
 * Интерфейс стратегии из базы данных (snake_case)
 */
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

/**
 * Сервис для работы со стратегиями
 */
export class StrategyService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Преобразует запись из БД в объект Strategy с camelCase
   */
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

  /**
   * Получить все стратегии, преобразуя их в правильный формат
   */
  async getAllStrategies(): Promise<Strategy[]> {
    try {
      const result = await this.pool.query<DBStrategy>(
        'SELECT * FROM leveraged_strategies WHERE rn IS NOT NULL ORDER BY ma30_strategy_apr DESC'
      );

      // Преобразуем каждую запись из БД в объект Strategy
      return result.rows.map(row => this.mapDBtoStrategy(row));
    } catch (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }
  }
}
