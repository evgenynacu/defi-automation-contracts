import { SwapProviderFacade, SwapQuote } from "./providers/SwapProviderFacade"
import { ProviderRegistry } from "./providers/ProviderRegistry"
import { address } from "../types"

// Initialize providers
ProviderRegistry.initializeDefaultProviders()

export type SwapData = {
	time: number
	ex: string,
	in: number,
	out: number,
	to: address,
	data: `0x${string}`
}

export async function getSwaps(
	chainId: number,
	vault: address,
	swapAmount: bigint,
	fromToken: address,
	toToken: address,
	txOrigin: address,
	decimalsIn: number,
	decimalsOut: number
): Promise<SwapData[]> {
	const facade = SwapProviderFacade.getInstance()
	const quotes = await facade.getAllQuotes({
		chainId,
		vault,
		swapAmount,
		fromToken,
		toToken,
		txOrigin,
		decimalsIn,
		decimalsOut
	})

	return quotes.map(quote => quoteToSwapData(swapAmount, decimalsIn, quote))
}

function quoteToSwapData(swapAmount: bigint, decimalsIn: number, quote: SwapQuote): SwapData {
	const inAmount = Number(swapAmount) / (10 ** decimalsIn)
	return {
		time: quote.time,
		ex: quote.provider,
		in: inAmount,
		out: quote.outAmount,
		to: quote.to as address,
		data: quote.data
	}
}
