import {ISwapProvider} from "./ISwapProvider"
import {ProviderConfig, SwapParams, SwapResult} from "./types"
import {address} from "../../types"
import {MAX_SLIPPAGE_BPS} from "./config"
import { fetch, ProxyAgent } from "undici";

//export const ENABLED_AGGREGATORS = ["paraswap"].join(",")
export const ENABLED_AGGREGATORS = ["kyberswap", "odos", "okx", "paraswap"]

export class PendleProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "pendle",
			enabled: true,
		}
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		const market = await findActiveMarket(params.chainId, params.fromToken, params.toToken)
		if (market) {
			console.log("Found active Pendle Market. using it: " + market)
			const url = `https://api-v2.pendle.finance/core/v2/sdk/${params.chainId}/markets/${market}/swap?receiver=${params.vault}&slippage=${MAX_SLIPPAGE_BPS/10000}&enableAggregator=true&aggregators=${filterAggregators(params.chainId)}&tokenIn=${params.fromToken}&tokenOut=${params.toToken}&amountIn=${params.swapAmount.toString()}`
			const res = await fetch(url, { dispatcher: getProxyAgent() })
			if (res.status !== 200) {
				const text = await res.text()
				if (process.env.DEBUG_PENDLE) {
					console.error("Failed to fetch quote " + text)
				}
				throw new Error("Failed to fetch quote " + text)
			}

			const quote = await res.json() as QuoteResponse
			const data = quote.tx.data
			return {
				to: quote.tx.to,
				data: data,
				outAmount: BigInt(quote.data.amountOut),
			}
		}

		const inactiveMarket = await findInactiveMarket(params.chainId, params.fromToken, params.toToken)
		if (inactiveMarket) {
			console.log("Found inactive Pendle Market. using it: " + inactiveMarket)
			const exitUrl = `https://api-v2.pendle.finance/core/v2/sdk/1/markets/${inactiveMarket}/exit-positions?receiver=${params.vault}&slippage=${MAX_SLIPPAGE_BPS/10000}&enableAggregator=true&aggregators=${filterAggregators(params.chainId)}&ptAmount=${params.swapAmount.toString()}&ytAmount=0&lpAmount=0&tokenOut=${params.toToken}`
			const res = await fetch(exitUrl, { dispatcher: getProxyAgent() })

			if (res.status !== 200) {
				const text = await res.text()
				if (process.env.DEBUG_PENDLE) {
					console.error("Failed to fetch quote " + text)
				}
				throw new Error("Failed to fetch quote " + text)
			}

			const quote = await res.json() as QuoteResponse

			return {
				to: quote.tx.to,
				data: quote.tx.data,
				outAmount: BigInt(quote.data.amountOut),
			}
		}

		throw new Error("No pendle market found")
	}

	async isUniqueFor(params: SwapParams): Promise<boolean> {
		const active = await findActiveMarket(params.chainId, params.fromToken, params.toToken)
		if (active !== undefined) {
			return true
		}
		const inactiveMarket = await findInactiveMarket(params.chainId, params.fromToken, params.toToken)
		return inactiveMarket !== undefined;
	}

}

function getProxyAgent() {
	if (process.env.PENDLE_PROXIES) {
		const proxies = process.env.PENDLE_PROXIES.split(",")
		const randomIndex = Math.floor(Math.random() * (proxies.length + 1))
		if (randomIndex >= proxies.length) {
			console.log("not using proxy for this request")
			return undefined
		}
		console.log("using proxy for this request", proxies[randomIndex])
		return new ProxyAgent(proxies[randomIndex])
	}
	return undefined
}

async function findActiveMarket(chainId: number, tokenIn: string, tokenOut: string): Promise<string | undefined> {
	return findMarketByUrl(`https://api-v2.pendle.finance/core/v1/${chainId}/markets/active`, tokenIn, tokenOut)
}

async function findInactiveMarket(chainId: number, tokenIn: string, tokenOut: string): Promise<string | undefined> {
	return findMarketByUrl(`https://api-v2.pendle.finance/core/v1/${chainId}/markets/inactive`, tokenIn, tokenOut, true)
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
	const markets = await res.json() as Markets
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

function filterAggregators(chainId: number) {
	if (chainId === 9745) {
		return ENABLED_AGGREGATORS.filter(it => it !== "odos" && it !== "paraswap" && it !== "kyberswap").join(",")
	}
	return ENABLED_AGGREGATORS.join(",")
}