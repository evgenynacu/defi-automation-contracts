import { expect } from 'chai'
import { after, before, beforeEach, describe, it } from 'mocha'
import { Pool } from 'pg'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { StrategyService } from './strategy-service'
import { runMigrations } from '../db/run-migrations'

describe('StrategyService Integration Tests with TestContainers', function () {
  let container: StartedPostgreSqlContainer
  let pool: Pool
  let strategyService: StrategyService

  before(async function () {
    this.timeout(120000) // 2 minutes for container startup

    console.log('Starting PostgreSQL container...')

    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .withExposedPorts(5432)
      .start()

    console.log(`✓ PostgreSQL container started on port ${container.getMappedPort(5432)}`)

    // Initialize pool
    pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    })

    // Test connection
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log(`✓ Database connected: ${result.rows[0].now}`)
    client.release()

    // Run migrations to set up the database schema using the standard runMigrations function
    console.log('Running database migrations...')
    try {
      await runMigrations(pool)
      console.log('✓ Migrations completed successfully')
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }

    // Initialize service
    strategyService = new StrategyService(pool)
  })

  after(async function () {
    this.timeout(30000)

    if (pool) {
      await pool.end()
      console.log('✓ Database pool closed')
    }

    if (container) {
      await container.stop()
      console.log('✓ PostgreSQL container stopped')
    }
  })

  beforeEach(async function () {
    // Clean up the table and insert test data
    const client = await pool.connect()

    try {
      // Truncate the table to start fresh
      await client.query(`TRUNCATE TABLE leveraged_strategies`)

      // Insert test data
      await client.query(`
        INSERT INTO leveraged_strategies (
          yield_description, strategy_apr, ma7_strategy_apr, ma30_strategy_apr, 
          max_ltv, utilization, supply, debt_token, lending_description, 
          last_updated, lending_id, rn
        ) VALUES 
        ('ETH Recursive Borrowing', 5.89, 6.21, 5.72, 0.85, 0.78, 1450000, 'USDC', 
         'Recursive borrowing strategy using ETH as collateral', 
         '2025-07-14T09:23:47Z', 'strat-1', 1),
        ('WBTC Yield Aggregator', 4.42, 4.35, 4.18, 0.82, 0.65, 2340000, 'DAI', 
         'Yield aggregation strategy for WBTC holdings', 
         '2025-07-14T11:05:12Z', 'strat-2', 2),
        ('USDC Stable Leverage', 3.20, 3.18, 3.25, 0.90, 0.92, 5670000, 'USDT', 
         'Stable leverage strategy for USDC with minimal risk', 
         '2025-07-14T08:45:30Z', 'strat-3', 3),
        ('Test Strategy With Null RN', 2.50, 2.60, 2.70, 0.75, 0.60, 1000000, 'ETH', 
         'This strategy should be filtered out', 
         '2025-07-14T12:00:00Z', 'strat-null', NULL)
      `)

      console.log(`✓ Inserted test data into leveraged_strategies`)
    } finally {
      client.release()
    }
  })

  describe('getAllStrategies', () => {
    it('should retrieve all strategies with proper transformations', async function () {
      // Get strategies from service
      const strategies = await strategyService.getAllStrategies()

      // Verify results
      expect(strategies).to.be.an('array')
      expect(strategies.length).to.equal(3) // Should filter out the null rn record

      // Check for proper transformations
      const firstStrategy = strategies[0]

      // Verify type transformations
      expect(firstStrategy).to.have.all.keys(
        'id', 'name', 'apr30d', 'apr7d', 'apr1d', 'lltv',
        'utilization', 'totalSupply', 'debtToken', 'description', 'lastUpdated'
      )

      // Verify field mappings
      expect(firstStrategy.id).to.equal('strat-1')
      expect(firstStrategy.name).to.equal('ETH Recursive Borrowing')
      expect(firstStrategy.apr30d).to.equal(5.72)
      expect(firstStrategy.apr7d).to.equal(6.21)
      expect(firstStrategy.apr1d).to.equal(5.89)
      expect(firstStrategy.lltv).to.equal(0.85)
      expect(firstStrategy.utilization).to.equal(0.78)
      expect(firstStrategy.totalSupply).to.equal(1450000)
      expect(firstStrategy.debtToken).to.equal('USDC')
      expect(firstStrategy.description).to.equal('Recursive borrowing strategy using ETH as collateral')
      expect(firstStrategy.lastUpdated).to.be.an.instanceOf(Date)

      // Verify numeric conversions
      strategies.forEach(strategy => {
        expect(strategy.apr30d).to.be.a('number')
        expect(strategy.apr7d).to.be.a('number')
        expect(strategy.apr1d).to.be.a('number')
        expect(strategy.lltv).to.be.a('number')
        expect(strategy.utilization).to.be.a('number')
        expect(strategy.totalSupply).to.be.a('number')
      })

      console.log('✓ Successfully retrieved and transformed strategies:',
        strategies.map(s => ({
          id: s.id,
          name: s.name,
          apr30d: s.apr30d,
          totalSupply: s.totalSupply
        }))
      )
    })

    it('should handle empty result set', async function () {
      // Empty the table
      const client = await pool.connect()
      try {
        await client.query(`TRUNCATE TABLE leveraged_strategies`)
      } finally {
        client.release()
      }

      // Get strategies from an empty table
      const strategies = await strategyService.getAllStrategies()

      // Verify results
      expect(strategies).to.be.an('array')
      expect(strategies.length).to.equal(0)

      console.log('✓ Successfully handled empty result set')
    })

    it('should sort strategies by APR', async function () {
      const strategies = await strategyService.getAllStrategies()

      // Verify sorting
      for (let i = 0; i < strategies.length - 1; i++) {
        expect(strategies[i].apr30d).to.be.at.least(strategies[i + 1].apr30d)
      }

      console.log('✓ Strategies are properly sorted by APR')
    })
  })
})
