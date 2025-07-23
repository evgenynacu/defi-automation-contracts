export interface Strategy {
	id: string;
	name: string;
	apr30d: number;
	apr7d: number;
	apr1d: number;
	impliedApr7d: number;
	impliedApr30d: number;
	daysLeft: number;
	impliedRate: number;
	lltv: number;
	utilization: number;
	totalSupply: number;
	debtToken: string;
	description: string;
	lastUpdated: Date;
}

export type StrategyDetails = {
	day: Date
	apr1d: number
	apr7d: number
	apr30d: number
	yieldRate1d: number
	yieldRate7d: number
	yieldRate30d: number
	borrowRate1d: number
	borrowRate7d: number
	borrowRate30d: number
}