import dotenv from "dotenv"
import express, { Application } from "express"
import cors from "cors"
import { createContext } from "../context"
import { registerStrategiesEndpoints } from "./strategies"
import {exportAaveMetrics} from "./aave-exporter";
import {refreshViews} from "../context/service/refresh-views-service";

dotenv.config()

const app: Application = express()

app.use(express.json())

// Enable CORS for all routes
app.use(cors({
	origin: "*",
}))

createContext().then(async (context) => {
	const { connectionString, connectionPool, duneSyncService, ethRunner, arbRunner } = context

	app.get("/", (_, res) => {
		res.status(200).json({ status: "OK" })
	})

	registerStrategiesEndpoints(app, context)

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

	const refreshToken = process.env.REFRESH_VIEWS_TOKEN || "secret-refresh-token"
	if (!refreshToken) {
		console.warn("REFRESH_VIEWS_TOKEN is not set — POST /admin/refresh-views is disabled")
	}
	app.post("/admin/refresh-views", async (req, res) => {
		if (!refreshToken) {
			res.status(503).json({ status: "DISABLED", error: "REFRESH_VIEWS_TOKEN is not configured" })
			return
		}
		const provided = req.header("x-refresh-token") ?? req.header("authorization")?.replace(/^Bearer\s+/i, "")
		if (provided !== refreshToken) {
			res.status(401).json({ status: "UNAUTHORIZED" })
			return
		}
		const start = Date.now()
		try {
			const results = await refreshViews(connectionString)
			const contended = results.length === 1 && results[0].view === "*" && results[0].skipped === true
			if (contended) {
				res.status(409).json({
					status: "ALREADY_IN_PROGRESS",
					durationMs: Date.now() - start,
					results,
				})
				return
			}
			const failed = results.filter(r => !r.ok && !r.skipped)
			const status = failed.length === 0 ? 200 : 500
			res.status(status).json({
				status: failed.length === 0 ? "OK" : "PARTIAL_FAILURE",
				durationMs: Date.now() - start,
				results,
			})
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e)
			console.error("Failed to refresh views:", e)
			res.status(500).json({ status: "ERROR", error: msg })
		}
	})

	app.get("/data/leveraged-strategies-details", async (req, res) => {
		const { error, ...r } = await duneSyncService.syncQueryToPostgres({
			queryId: "5514773",
			apiKey: process.env.DUNE_API_KEY!,
			truncateBeforeInsert: true,
			tableName: "leveraged_strategies_details",
			doNotExecute: true,
			pageSize: 2000,
		})
		if (error) {
			console.error("Error syncing data", error)
		}
		res.status(200).json({ status: "OK", ...r })
	})

})
