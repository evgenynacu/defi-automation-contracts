import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { address } from "../../types"

export class PendleProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "Pendle",
			enabled: true,
		}
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		const market = await findMarket(params.fromToken, params.toToken)
		if (!market) {
			throw new Error("No pendle market found")
		}

		const url = `https://api-v2.pendle.finance/core/v1/sdk/${params.chainId}/markets/${market}/swap?receiver=${params.vault}&slippage=0.0005&enableAggregator=true&tokenIn=${params.fromToken}&tokenOut=${params.toToken}&amountIn=${params.swapAmount.toString()}`
		const res = await fetch(url)
		if (res.status !== 200) {
			throw new Error("Failed to fetch quote " + await res.text())
		}

		const quote: QuoteResponse = await res.json()

		return {
			to: quote.tx.to,
			data: quote.tx.data,
			outAmount: BigInt(quote.data.amountOut),
		}
	}

}

async function findMarket(tokenIn: string, tokenOut: string): Promise<string | undefined> {
	const res = await fetch("https://api-v2.pendle.finance/core/v1/1/markets/active")
	if (res.status !== 200) {
		throw new Error("Failed to fetch markets " + await res.text())
	}
	const markets: Markets = await res.json()
	for (const market of markets.markets) {
		if (market.pt && (market.pt.toLowerCase().indexOf(tokenIn.toLowerCase()) !== -1 || market.pt.toLowerCase().indexOf(tokenOut.toLowerCase()) !== -1)) {
			return market.address
		}
	}
	return undefined
}

type Markets = {
	markets: {
		address: string,
		pt: string
	}[]
}

type QuoteResponse = {
	tx: {
		data: `0x${string}`,
		to: address,
	}
	data: {
		amountOut: string
	}
}