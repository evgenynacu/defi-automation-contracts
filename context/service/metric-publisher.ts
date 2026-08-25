import { DataRequest } from "./data-service"
import { wallets } from "../wallets"
import { marketIds } from "../morpho"
import { tokens, findToken } from "../tokens"
import { eulerPositions } from "../euler"
import {
	aaveFreeSupplyGauge,
	aaveHFGauge,
	collateralPriceGauge,
	compoundHFGauge,
	hfGauge,
	ltvGauge,
	openPositionSizeGauge,
	pendleImpliedRateGauge,
	swapRateGauge,
	aaveV4SupplyLeftGauge,
	aaveV4SupplyCapGauge,
	aaveV4BorrowableGauge,
	morphoBorrowApyGauge,
	routePoolLiquidityGauge,
	routePoolV4LiquidityGauge,
} from "../metrics/registry"
import {getSpokeName} from "../../common/aave-v4/addresses"

type SyncData = {
	result: number
	ltv?: number
	hf?: number
	rate?: number
	supplyCap?: number
	borrowable?: number
	[key: string]: unknown
}

// Publishes Prometheus metrics in lockstep with sync-service writes to the `data` table.
// Label/value semantics mirror server/exporter.ts so dashboards keep working unchanged.
export class MetricPublisher {
	publish(request: DataRequest, data: SyncData): void {
		switch (request.type) {
			case "morpho-withdraw": {
				const wallet = wallets[request.from] || request.from
				const positionId = marketIds[request.marketId] || request.marketId
				this.setPositionGauges(wallet, positionId, data)
				return
			}
			case "aave-withdraw": {
				const positionId =
					(tokens[request.collateralToken] || request.collateralToken) +
					"/" +
					(tokens[request.debtToken] || request.debtToken)
				this.setPositionGauges("NONE", positionId, data)
				return
			}
			case "aave-ob-withdraw": {
				const positionId =
					(tokens[request.collateralToken] || request.collateralToken) +
					"/" +
					(tokens[request.debtToken] || request.debtToken)
				this.setPositionGauges("Vault", positionId, data)
				return
			}
			case "euler-withdraw": {
				const pos = eulerPositions.find(
					it => it.collateralVault === request.collateralVault && it.debtVault === request.debtVault,
				)
				if (pos === undefined) return
				const wallet = wallets[request.from] || request.from
				const positionId = pos.collateral + "/" + pos.debt + " Euler"
				this.setPositionGauges(wallet, positionId, data)
				return
			}
			case "swap-rate": {
				swapRateGauge.set(
					{
						from: tokens[request.fromToken] || request.fromToken,
						to: tokens[request.toToken] || request.toToken,
					},
					data.result,
				)
				return
			}
			case "aave-health-factor": {
				aaveHFGauge.set({ wallet: wallets[request.from] || request.from }, data.result)
				return
			}
			case "compound-health-factor": {
				compoundHFGauge.set(
					{ wallet: wallets[request.from] || request.from, comet: request.comet },
					data.result,
				)
				return
			}
			case "aave-v4-capacity": {
				const labels = { spoke: getSpokeName(request.spoke), token: findToken(request.token) || request.token }
				aaveV4SupplyLeftGauge.set(labels, data.result)
				if (data.supplyCap !== undefined) aaveV4SupplyCapGauge.set(labels, data.supplyCap)
				if (data.borrowable !== undefined) aaveV4BorrowableGauge.set(labels, data.borrowable)
				return
			}
			case "morpho-borrow-rate": {
				morphoBorrowApyGauge.set(
					{ market: marketIds[request.marketId] || request.marketId },
					data.result,
				)
				return
			}
			case "pool-liquidity": {
				const { stage, venue, source } = request
				if (source.kind === "uniswap-v4") {
					routePoolV4LiquidityGauge.set({ stage, venue }, data.result)
				} else {
					routePoolLiquidityGauge.set(
						{ stage, venue, token: findToken(source.token) || source.token },
						data.result,
					)
				}
				return
			}
			case "aave-free-supply": {
				aaveFreeSupplyGauge.set({ token: findToken(request.token) || request.token }, data.result)
				return
			}
			case "pendle-implied-rate": {
				pendleImpliedRateGauge.set({ token: findToken(request.market) || request.market }, data.result)
				return
			}
			case "compound-withdraw":
				// Not handled by server/exporter.ts either — keep parity.
				return
		}
	}

	private setPositionGauges(wallet: string, positionId: string, data: SyncData): void {
		openPositionSizeGauge.set({ wallet, position_id: positionId }, data.result)
		if (data.ltv) {
			ltvGauge.set({ wallet, position_id: positionId }, data.ltv)
		}
		if (data.rate) {
			collateralPriceGauge.set({ wallet, position_id: positionId }, data.rate)
		}
		if (data.hf) {
			hfGauge.set({ wallet, position_id: positionId }, data.hf)
		}
	}
}
