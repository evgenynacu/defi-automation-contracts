import { SwapParams, SwapResult } from "./types"
import { ProviderRegistry } from "./ProviderRegistry"

export type SwapQuote = {
	time: number,
	provider: string
	outAmount: number
	to: string
	data: `0x${string}`
}

export class SwapProviderFacade {
	private static instance: SwapProviderFacade
	private readonly registry: ProviderRegistry

	private constructor() {
		this.registry = ProviderRegistry.getInstance()
	}

	public static getInstance(): SwapProviderFacade {
		if (!SwapProviderFacade.instance) {
			SwapProviderFacade.instance = new SwapProviderFacade()
		}
		return SwapProviderFacade.instance
	}

	public async getAllQuotes(params: SwapParams): Promise<SwapQuote[]> {
		const providers = this.registry.getEnabledProviders()
		const start = Date.now()
		let allowed: string[] = []
		if (params.preferred !== undefined) {
			if (typeof params.preferred === "string") {
				allowed = [params.preferred]
			} else {
				allowed = params.preferred
			}
		}
		const quotes = await Promise.all(
			providers.map(provider => {
					const name = provider.getConfig().name
					if (allowed.length > 0 && !allowed.includes(name)) {
						return null
					}
					return provider.getQuote(params)
						.then(quote => this.toSwapQuote(Date.now() - start, name, quote, params.decimalsOut))
						.catch(() => {
							return null
						})
				}
			)
		)

		return quotes.filter((q): q is SwapQuote => q !== null)
	}

	private toSwapQuote(time: number, provider: string, result: SwapResult, decimalsOut: number): SwapQuote {
		return {
			time,
			provider,
			outAmount: Number(result.outAmount) / 10 ** decimalsOut,
			to: result.to,
			data: result.data
		}
	}
}