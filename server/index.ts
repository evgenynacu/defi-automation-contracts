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

createContext().then(async ({ connectionPool, dataService }) => {
	app.get("/", (_, res) => {
		res.status(200).json({ status: "OK" })
	})

	app.get('/metrics', async (_req, res) => {
		res.set('Content-Type', register.contentType)
		res.end(await register.metrics())
	})

	const PORT = process.env.PORT || 8080

	app.listen(PORT, (): void => console.log(`Server is running on ${PORT}`))


	setInterval(() => {
		exportLatestData(connectionPool).then()
	}, 5000)
})
