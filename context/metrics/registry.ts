import { Gauge, Registry } from 'prom-client'

export const register = new Registry()

export const aaveHFGauge = new Gauge({
	name: 'aave_health_factor',
	help: 'Aave health factor',
	labelNames: ['wallet'],
})

export const compoundHFGauge = new Gauge({
	name: 'compound_health_factor',
	help: 'Compound health factor',
	labelNames: ['wallet', 'comet'],
})

export const openPositionSizeGauge = new Gauge({
	name: 'open_position_size',
	help: 'Size of every open position',
	labelNames: ['position_id', 'wallet'],
})

export const ltvGauge = new Gauge({
	name: 'ltv',
	help: 'LTV of every open position',
	labelNames: ['position_id', 'wallet'],
})

export const hfGauge = new Gauge({
	name: 'hf',
	help: 'Health factor of every open position',
	labelNames: ['position_id', 'wallet'],
})

export const collateralPriceGauge = new Gauge({
	name: 'collateral_price',
	help: 'Collateral price denominated in debt tokens',
	labelNames: ['position_id', 'wallet'],
})

export const swapRateGauge = new Gauge({
	name: 'swap_rate',
	help: 'Swap Rate',
	labelNames: ['from', 'to'],
})

export const aaveFreeSupplyGauge = new Gauge({
	name: 'aave_free_supply',
	help: 'Aave free supply',
	labelNames: ['token'],
})

export const aaveReserveCapGauge = new Gauge({
	name: 'aave_reserve_cap',
	help: 'Aave reserve cap',
	labelNames: ['token'],
})

export const aaveTotalSuppliedGauge = new Gauge({
	name: 'aave_total_supplied',
	help: 'Aave Total supplied',
	labelNames: ['token'],
})

// Aave v4 caps are per (spoke, reserve), so both labels are needed: the same token has different
// headroom on different spokes, and a spoke can list one token twice from two hubs.
export const aaveV4SupplyLeftGauge = new Gauge({
	name: 'aave_v4_supply_left',
	help: 'Aave v4 remaining supply headroom for a spoke reserve, in whole units',
	labelNames: ['spoke', 'token'],
})

export const aaveV4SupplyCapGauge = new Gauge({
	name: 'aave_v4_supply_cap',
	help: 'Aave v4 supply cap (addCap) for a spoke reserve, in whole units',
	labelNames: ['spoke', 'token'],
})

export const aaveV4BorrowableGauge = new Gauge({
	name: 'aave_v4_borrowable',
	help: 'Aave v4 borrowable now for a spoke reserve: min(credit line left, hub liquidity)',
	labelNames: ['spoke', 'token'],
})

export const pendleImpliedRateGauge = new Gauge({
	name: 'pendle_implied_rate',
	help: 'Implied rate of pendle PT',
	labelNames: ['token'],
})

register.registerMetric(swapRateGauge)
register.registerMetric(collateralPriceGauge)
register.registerMetric(pendleImpliedRateGauge)
register.registerMetric(aaveHFGauge)
register.registerMetric(compoundHFGauge)
register.registerMetric(openPositionSizeGauge)
register.registerMetric(ltvGauge)
register.registerMetric(hfGauge)
register.registerMetric(aaveFreeSupplyGauge)
register.registerMetric(aaveReserveCapGauge)
register.registerMetric(aaveTotalSuppliedGauge)
register.registerMetric(aaveV4SupplyLeftGauge)
register.registerMetric(aaveV4SupplyCapGauge)
register.registerMetric(aaveV4BorrowableGauge)
