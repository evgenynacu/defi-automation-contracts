import {ISwapProvider} from "./ISwapProvider"
import {ProviderConfig, SwapParams, SwapResult} from "./types"
import {address} from "../../types"
import {MAX_SLIPPAGE_BPS} from "./config"

//export const ENABLED_AGGREGATORS = ["paraswap"].join(",")
export const ENABLED_AGGREGATORS = ["kyberswap", "odos", "okx", "paraswap"].join(",")

export class PendleProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "pendle",
			enabled: true,
		}
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		const market = await findActiveMarket(params.fromToken, params.toToken)
		if (market) {
			console.log("Found active Pendle Market. using it: " + market)
			const url = `https://api-v2.pendle.finance/core/v2/sdk/${params.chainId}/markets/${market}/swap?receiver=${params.vault}&slippage=${MAX_SLIPPAGE_BPS/10000}&enableAggregator=true&aggregators=${ENABLED_AGGREGATORS}&tokenIn=${params.fromToken}&tokenOut=${params.toToken}&amountIn=${params.swapAmount.toString()}`
			const res = await fetch(url)
			if (res.status !== 200) {
				const text = await res.text()
				if (process.env.DEBUG_PENDLE) {
					console.error("Failed to fetch quote " + text)
				}
				throw new Error("Failed to fetch quote " + text)
			}

			const quote: QuoteResponse = await res.json()
			const data = quote.tx.data
			return {
				to: quote.tx.to,
				data: data,
				outAmount: BigInt(quote.data.amountOut),
			}
		}

		const inactiveMarket = await findInactiveMarket(params.fromToken, params.toToken)
		if (inactiveMarket) {
			console.log("Found inactive Pendle Market. using it: " + inactiveMarket)
			const exitUrl = `https://api-v2.pendle.finance/core/v2/sdk/1/markets/${inactiveMarket}/exit-positions?receiver=${params.vault}&slippage=${MAX_SLIPPAGE_BPS/10000}&enableAggregator=true&aggregators=${ENABLED_AGGREGATORS}&ptAmount=${params.swapAmount.toString()}&ytAmount=0&lpAmount=0&tokenOut=${params.toToken}`
			const res = await fetch(exitUrl)

			if (res.status !== 200) {
				const text = await res.text()
				if (process.env.DEBUG_PENDLE) {
					console.error("Failed to fetch quote " + text)
				}
				throw new Error("Failed to fetch quote " + text)
			}

			const quote: QuoteResponse = await res.json()

			return {
				to: quote.tx.to,
				data: quote.tx.data,
				outAmount: BigInt(quote.data.amountOut),
			}
		}

		throw new Error("No pendle market found")
	}

	async isUniqueFor(params: SwapParams): Promise<boolean> {
		const active = await findActiveMarket(params.fromToken, params.toToken)
		if (active !== undefined) {
			return true
		}
		const inactiveMarket = await findInactiveMarket(params.fromToken, params.toToken)
		return inactiveMarket !== undefined;
	}

}

async function findActiveMarket(tokenIn: string, tokenOut: string): Promise<string | undefined> {
	return findMarketByUrl("https://api-v2.pendle.finance/core/v1/1/markets/active", tokenIn, tokenOut)
}

async function findInactiveMarket(tokenIn: string, tokenOut: string): Promise<string | undefined> {
	return findMarketByUrl("https://api-v2.pendle.finance/core/v1/1/markets/inactive", tokenIn, tokenOut, true)
}

async function findMarketByUrl(url: string, tokenIn: string, tokenOut: string, onlyExit = false): Promise<string | undefined> {
	const markets: Markets = await getMarketsByUrl(url)
	for (const market of markets.markets) {
		if (market.pt && market.pt.toLowerCase().indexOf(tokenIn.toLowerCase()) !== -1) {
			return market.address
		}
		if (!onlyExit && market.pt && market.pt.toLowerCase().indexOf(tokenOut.toLowerCase()) !== -1) {
			return market.address
		}
	}
	return undefined
}

const cache: Record<string, { ts: number, markets: Markets }> = {

}

async function getMarketsByUrl(url: string) {
	if (cache[url]) {
		const byUrl = cache[url]
		if (Date.now() - byUrl.ts < 1000 * 60 * 10) {
			return byUrl.markets
		}
	}
	console.log(`Fetching markets for ${url}`)
	const res = await fetch(url)
	if (res.status !== 200) {
		const text = await res.text()
		if (process.env.DEBUG_PENDLE) {
			console.error("Failed to fetch markets " + text)
		}
		throw new Error("Failed to fetch markets " + text)
	}
	const markets: Markets = await res.json()
	cache[url] = {
		ts: Date.now(),
		markets,
	}
	return markets
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