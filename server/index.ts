import dotenv from "dotenv"
import express, { Application } from "express"
import cors from "cors"
import { createContext } from "../context"
import { register } from './metrics'
import { exportLatestData } from "./exporter"

dotenv.config()

const app: Application = express()

app.use(express.json())

// Enable CORS for all routes
app.use(cors({
	origin: "*",
}))

createContext().then(async ({ connectionPool, duneSyncService }) => {
	app.get("/", (_, res) => {
		res.status(200).json({ status: "OK" })
	})

	app.get('/metrics', async (_req, res) => {
		res.set('Content-Type', register.contentType)
		res.end(await register.metrics())
	})

	const PORT = process.env.PORT || 8080

	app.listen(PORT, (): void => console.log(`Server is running on ${PORT}`))

	app.get("/data/susde-rates", async (req, res) => {
		const { error, ...r } = await duneSyncService.syncQueryToPostgres({
			queryId: "5378953",
			apiKey: process.env.DUNE_API_KEY!,
			pageSize: 1000,
			tableName: "susde_rates",
			doNotExecute: true,
			truncateBeforeInsert: true,
		})
		if (error) {
			console.error("Error syncing data", error)
		}
		res.status(200).json({ status: "OK", ...r })
	})

	app.get("/data/syrup-rates", async (req, res) => {
		const { error, ...r } = await duneSyncService.syncQueryToPostgres({
			queryId: "5436390",
			apiKey: process.env.DUNE_API_KEY!,
			pageSize: 1000,
			tableName: "syrup_rates",
			doNotExecute: true,
			truncateBeforeInsert: true,
		})
		if (error) {
			console.error("Error syncing data", error)
		}
		res.status(200).json({ status: "OK", ...r })
	})

	setInterval(() => {
		exportLatestData(connectionPool).then()
	}, 5000)
})
