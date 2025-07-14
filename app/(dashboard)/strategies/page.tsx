import { StrategiesTable } from "@/components/strategies-table"

export default function StrategiesPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Strategies</h1>
				<p className="text-muted-foreground">View available DeFi strategies across protocols</p>
			</div>

			<div className="rounded-lg border bg-card">
				<div className="p-6 border-b">
					<h2 className="text-xl font-semibold">Available Strategies</h2>
					<p className="text-sm text-muted-foreground">A list of all available DeFi strategies with current performance
						metrics</p>
				</div>
				<div className="overflow-x-auto">
					<StrategiesTable/>
				</div>
			</div>
		</div>
	)
}

