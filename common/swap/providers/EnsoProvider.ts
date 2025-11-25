import {ISwapProvider} from "./ISwapProvider";
import {ProviderConfig, SwapParams, SwapResult} from "./types";
import {MAX_SLIPPAGE_BPS} from "./config";
import process from "process";

export class EnsoApiProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "enso-api",
			enabled: true,
		}
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		if (!process.env.ENSO_API_KEY) {
			console.warn("ENSO_API_KEY is not set")
			throw new Error("ENSO_API_KEY is not set")
		}
		const url = `https://api.enso.finance/api/v1/shortcuts/route?chainId=${params.chainId}&fromAddress=${params.txOrigin}&receiver=${params.vault}&refundReceiver=${params.vault}&amountIn=${params.swapAmount.toString()}&slippage=${MAX_SLIPPAGE_BPS}&fee=0&feeReceiver=${params.vault}&tokenIn=${params.fromToken}&tokenOut=${params.toToken}`
		const res = await fetch(url, {
			method: 'GET',
			headers: { "Authorization": `Bearer ${process.env.ENSO_API_KEY}` },
		})
		if (res.status !== 200) {
			const text = "Failed to fetch quote " + await res.text()
			throw new Error(text)
		}

		const quote: EnsoQuoteResponse = await res.json()

		return {
			to: quote.tx.to,
			data: quote.tx.data,
			outAmount: BigInt(quote.amountOut),
		}
	}

	async isUniqueFor(): Promise<boolean> {
		return false
	}

}

type EnsoQuoteResponse = {
	amountOut: string,
	tx: {
		data: `0x${string}`,
		to: `0x${string}`,
	}
}