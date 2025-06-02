import { Gauge, Registry } from 'prom-client'

export const register = new Registry()

export const walletHFGauge = new Gauge({
	name: 'wallet_health_factor',
	help: 'Wallet health factor',
	labelNames: ['wallet'],
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

register.registerMetric(walletHFGauge)
register.registerMetric(openPositionSizeGauge)
register.registerMetric(ltvGauge)