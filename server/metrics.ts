import { Gauge, Registry } from 'prom-client'

export const register = new Registry()

export const openPositionSizeGauge = new Gauge({
	name: 'open_position_size',
	help: 'Size of every open position',
	labelNames: ['position_id', 'wallet'],
})

register.registerMetric(openPositionSizeGauge)