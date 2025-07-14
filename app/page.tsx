import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function HomePage() {
	return (
		<div className="container mx-auto p-8 space-y-8">
			<div className="text-center space-y-4">
				<h1 className="text-4xl font-bold">DeFi Automation Platform</h1>
				<p className="text-muted-foreground">Testing shadcn/ui components</p>
			</div>

			{/* Buttons */}
			<Card>
				<CardHeader>
					<CardTitle>Buttons</CardTitle>
					<CardDescription>Different button variants</CardDescription>
				</CardHeader>
				<CardContent className="space-x-4">
					<Button>Primary</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="outline">Outline</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="destructive">Destructive</Button>
				</CardContent>
			</Card>

			{/* Form Elements */}
			<Card>
				<CardHeader>
					<CardTitle>Form Elements</CardTitle>
					<CardDescription>Input fields and badges</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Input placeholder="Enter wallet address..." />
						<Input type="number" placeholder="Amount in ETH" />
					</div>
					<div className="space-x-2">
						<Badge>Active</Badge>
						<Badge variant="secondary">Pending</Badge>
						<Badge variant="outline">Inactive</Badge>
						<Badge variant="destructive">Error</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Alert */}
			<Alert>
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>
					This is a test alert component. All shadcn/ui components are working!
				</AlertDescription>
			</Alert>

			{/* Grid of Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Total Positions</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">12</p>
						<p className="text-sm text-muted-foreground">Active positions</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Total Value</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">$45,230</p>
						<p className="text-sm text-muted-foreground">USD value</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Health Factor</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-green-600">2.4</p>
						<p className="text-sm text-muted-foreground">Safe</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}