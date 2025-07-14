import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Типы данных для стратегий
type Strategy = {
	id: string
	name: string
	apr30d: number
	apr7d: number
	apr1d: number
	lltv: number
	utilization: number
	totalSupply: number
	debtToken: string
	description: string
	lastUpdated: string
}

// Пример данных стратегий
const strategies: Strategy[] = [
	{
		id: "1",
		name: "ETH Recursive Borrowing",
		apr30d: 5.72,
		apr7d: 6.21,
		apr1d: 5.89,
		lltv: 0.85,
		utilization: 0.78,
		totalSupply: 1450000,
		debtToken: "USDC",
		description: "Recursive borrowing strategy using ETH as collateral",
		lastUpdated: "2025-07-14T09:23:47Z"
	},
	{
		id: "2",
		name: "WBTC Yield Aggregator",
		apr30d: 4.18,
		apr7d: 4.35,
		apr1d: 4.42,
		lltv: 0.82,
		utilization: 0.65,
		totalSupply: 2340000,
		debtToken: "DAI",
		description: "Yield aggregation strategy for WBTC holdings",
		lastUpdated: "2025-07-14T11:05:12Z"
	},
	{
		id: "3",
		name: "USDC Stable Leverage",
		apr30d: 3.25,
		apr7d: 3.18,
		apr1d: 3.20,
		lltv: 0.90,
		utilization: 0.92,
		totalSupply: 5670000,
		debtToken: "USDT",
		description: "Stable leverage strategy for USDC with minimal risk",
		lastUpdated: "2025-07-14T08:45:30Z"
	},
	{
		id: "4",
		name: "ETH-USDC LP Optimizer",
		apr30d: 8.45,
		apr7d: 9.12,
		apr1d: 7.89,
		lltv: 0.75,
		utilization: 0.68,
		totalSupply: 980000,
		debtToken: "ETH",
		description: "Liquidity provision optimization for ETH-USDC pairs",
		lastUpdated: "2025-07-13T22:10:55Z"
	},
	{
		id: "5",
		name: "wstETH Recursive Strategy",
		apr30d: 6.84,
		apr7d: 6.92,
		apr1d: 6.77,
		lltv: 0.88,
		utilization: 0.83,
		totalSupply: 3210000,
		debtToken: "USDC",
		description: "Recursive strategy leveraging staked ETH yields",
		lastUpdated: "2025-07-14T05:32:19Z"
	}
]

// Форматирование даты
function formatDate(dateString: string): string {
	const date = new Date(dateString)
	return new Intl.DateTimeFormat('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date)
}

// Форматирование числа с процентами
function formatPercent(value: number): string {
	return `${value.toFixed(2)}%`
}

// Форматирование числа с долларом
function formatUSD(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(value)
}

export function StrategiesTable() {
	return (
		<Table>
			<TableCaption>List of available DeFi strategies aggregated from various protocols.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>APR 30d</TableHead>
					<TableHead>APR 7d</TableHead>
					<TableHead>APR 1d</TableHead>
					<TableHead>LLTV</TableHead>
					<TableHead>Utilization</TableHead>
					<TableHead>Total Supply</TableHead>
					<TableHead>Debt Token</TableHead>
					<TableHead>Description</TableHead>
					<TableHead>Last Updated</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{strategies.map((strategy) => (
					<TableRow key={strategy.id} className="cursor-pointer hover:bg-muted/60">
						<TableCell className="font-medium">{strategy.name}</TableCell>
						<TableCell className={getAPRColorClass(strategy.apr30d)}>{formatPercent(strategy.apr30d)}</TableCell>
						<TableCell className={getAPRColorClass(strategy.apr7d)}>{formatPercent(strategy.apr7d)}</TableCell>
						<TableCell className={getAPRColorClass(strategy.apr1d)}>{formatPercent(strategy.apr1d)}</TableCell>
						<TableCell>{strategy.lltv.toFixed(2)}</TableCell>
						<TableCell>
							<div className="w-full bg-muted rounded-full h-2 overflow-hidden">
								<div
									className="bg-primary h-full rounded-full"
									style={{ width: `${strategy.utilization * 100}%` }}
								></div>
							</div>
							<span className="text-xs text-muted-foreground mt-1 block">
                {formatPercent(strategy.utilization * 100)}
              </span>
						</TableCell>
						<TableCell>{formatUSD(strategy.totalSupply)}</TableCell>
						<TableCell>
							<Badge variant="outline">{strategy.debtToken}</Badge>
						</TableCell>
						<TableCell className="max-w-xs truncate" title={strategy.description}>
							{strategy.description}
						</TableCell>
						<TableCell>{formatDate(strategy.lastUpdated)}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}

// Вспомогательная функция для определения цвета APR
function getAPRColorClass(apr: number): string {
	if (apr >= 7) return "text-green-600 font-medium"
	if (apr >= 4) return "text-emerald-500 font-medium"
	if (apr >= 2) return "text-blue-500 font-medium"
	return "text-muted-foreground"
}
