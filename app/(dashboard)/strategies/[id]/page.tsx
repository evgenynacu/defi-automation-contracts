import { notFound } from "next/navigation"
import { API_BASE_URL, REVALIDATE_INTERVAL } from "@/lib/env"
import { Breadcrumb } from "@/components/breadcrumb"

async function getStrategy(id: string) {
	try {
		const apiUrl = `${API_BASE_URL}/api/strategies/${encodeURIComponent(id)}`
		const response = await fetch(apiUrl, {
			next: { revalidate: REVALIDATE_INTERVAL }
		})

		if (!response.ok) {
			return null
		}

		return await response.json()
	} catch (error) {
		console.error('Error fetching strategy details:', error)
		return null
	}
}

export default async function StrategyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
	// Decode the ID from URL parameter
	const { id } = await params
	const decodedId = decodeURIComponent(id)
	const strategy = await getStrategy(decodedId)

	if (!strategy) {
		notFound()
	}

	return (
		<div className="container py-6">
			<Breadcrumb items={[
				{ label: 'Strategies', href: '/strategies' },
				{ label: strategy.name }
			]} />
			<h1 className="text-3xl font-bold mb-6">{strategy.name}</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="bg-card p-6 rounded-lg shadow-sm">
					<h2 className="text-xl font-semibold mb-4">APR Performance</h2>
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">Last 24 hours:</span>
							<span className="font-medium">{(strategy.apr1d * 100).toFixed(2)}%</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">Last 7 days:</span>
							<span className="font-medium">{(strategy.apr7d * 100).toFixed(2)}%</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">Last 30 days:</span>
							<span className="font-medium">{(strategy.apr30d * 100).toFixed(2)}%</span>
						</div>
					</div>
				</div>

				<div className="bg-card p-6 rounded-lg shadow-sm">
					<h2 className="text-xl font-semibold mb-4">Strategy Information</h2>
					<div className="space-y-4">
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">LLTV:</span>
							<span className="font-medium">{strategy.lltv.toFixed(2)}</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">Total Supply:</span>
							<span className="font-medium">${strategy.totalSupply.toLocaleString()}</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">Debt Token:</span>
							<span className="font-medium">{strategy.debtToken}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-card p-6 rounded-lg shadow-sm mb-8">
				<h2 className="text-xl font-semibold mb-4">Description</h2>
				<p className="text-muted-foreground">{strategy.description}</p>
			</div>

			<div className="bg-card p-6 rounded-lg shadow-sm">
				<h2 className="text-xl font-semibold mb-4">Utilization</h2>
				<div className="w-full bg-muted rounded-full h-4 mb-2 overflow-hidden">
					<div
						className="bg-primary h-full rounded-full"
						style={{ width: `${strategy.utilization * 100}%` }}
					></div>
				</div>
				<p className="text-sm text-muted-foreground text-right">
					{(strategy.utilization * 100).toFixed(2)}%
				</p>
			</div>
		</div>
	)
}
