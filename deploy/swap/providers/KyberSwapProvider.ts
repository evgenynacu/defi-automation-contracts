import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { address } from "../../types"
import { MAX_SLIPPAGE_BPS } from "./config"

export class KyberSwapProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "kyberswap-api",
			enabled: true,
		}
	}

	async getQuote(
		{ fromToken, toToken, swapAmount, vault, chainId }: SwapParams,
	): Promise<SwapResult> {
		const network = chainIdMapping[chainId]

		const routeResponse = await fetch(`https://aggregator-api.kyberswap.com/${network}/api/v1/routes?tokenIn=${fromToken}&tokenOut=${toToken}&amountIn=${swapAmount.toString()}`, {
			method: 'GET',
			headers: { "x-client-id": "automated defi strategy" },
		})
		const routeData: RouteResponse = await routeResponse.json()
		if (routeData.code !== 0) {
			throw new Error("Response code != 0 in " + JSON.stringify(routeData))
		}

		const buildRresponse = await fetch(`https://aggregator-api.kyberswap.com/${network}/api/v1/route/build`, {
			method: 'POST',
			headers: {
				"x-client-id": "automated defi strategy",
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				routeSummary: routeData.data.routeSummary,
				sender: vault,
				recipient: vault,
				slippageTolerance: MAX_SLIPPAGE_BPS,
			}),
		});
		const buildData: BuildResponse = await buildRresponse.json();
		if (buildData.code !== 0) {
			throw new Error("Response code != 0 in " + JSON.stringify(buildData))
		}

		return {
			outAmount: BigInt(buildData.data.amountOut),
			data: buildData.data.data,
			to: buildData.data.routerAddress,
		}
	}
}

const chainIdMapping: Record<number, string> = {
	1: "ethereum",
	42161: "arbitrum",
}

type RouteResponse = {
	code: number
	data: {
		routeSummary: any
		routerAddress: address
	}
}

type BuildResponse = {
	code: number
	data: {
		amountOut: string
		data: `0x${string}`
		routerAddress: address,
	}
}