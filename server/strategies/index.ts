import { Context } from "../../context"
import { Application } from "express"
import asyncHandler from "express-async-handler"

export function registerStrategiesEndpoints(app: Application, { strategyService }: Context) {
	app.get("/api/strategies", asyncHandler(async (req, res) => {
		const strategies = await strategyService.getAllStrategies()
		res.json(strategies)
	}))

	app.get("/api/strategies/:id", asyncHandler(async (req, res) => {
		const strategy = await strategyService.getStrategyById(req.params.id)
		if (!strategy) {
			res.status(404).json({ status: "NOT_FOUND" })
			return
		}
		res.json(strategy)
	}))

	app.get("/api/strategies/:id/details/:ltv", asyncHandler(async (req, res) => {
		const details = await strategyService.getStrategyDetails(req.params.id, parseFloat(req.params.ltv))
		res.json(details)
	}))
}