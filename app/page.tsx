export default function Home() {
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto py-12 px-4">
				<h1 className="text-4xl font-bold text-gray-900 mb-8">
					DeFi Automation Platform
				</h1>

				<div className="grid gap-6">
					<div className="bg-white rounded-lg shadow-sm p-6">
						<h2 className="text-2xl font-semibold text-gray-800 mb-4">
							Welcome to your DeFi dashboard
						</h2>
						<p className="text-gray-600 mb-4">
							This is your Next.js frontend. The Express API backend is separate.
						</p>
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-blue-800">
								🚀 Next.js is running successfully!
							</p>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-3">
							Available Features
						</h3>
						<ul className="space-y-2 text-gray-600">
							<li>• Morpho Blue integration</li>
							<li>• Aave protocol support</li>
							<li>• Automated withdrawals</li>
							<li>• Real-time monitoring</li>
						</ul>
					</div>
				</div>
			</div>
		</main>
	)
}