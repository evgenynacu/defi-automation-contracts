"use client";

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
import { formatDate, formatPercent, formatUSD, getAPRColorClass } from "@/lib/utils"
import { TableSkeleton } from "@/components/table-skeleton"
import { useStrategies } from "@/hooks/useStrategies"
import Link from "next/link"

export function StrategiesTable() {
	const { strategies, loading, error, refetch } = useStrategies();

	if (loading) {
		return <TableSkeleton columns={10} rows={5} />
	}

	if (error) {
		return (
			<div className="p-6 text-center">
				<p className="text-destructive">{error}</p>
				<button
					className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
					onClick={refetch}
				>
					Retry
				</button>
			</div>
		)
	}

	if (strategies.length === 0) {
		return (
			<div className="p-6 text-center">
				<p className="text-muted-foreground">No strategies available at the moment.</p>
			</div>
		)
	}

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
						<TableCell className="font-medium">
							<Link href={`/strategies/${encodeURIComponent(strategy.id)}`} className="hover:underline">
								{strategy.name}
							</Link>
						</TableCell>
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
                {formatPercent(strategy.utilization)}
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
