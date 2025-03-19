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
    const quotes = await Promise.all(
      providers.map(provider =>
        provider.getQuote(params)
          .then(quote => this.toSwapQuote(Date.now() - start, provider.getConfig().name, quote, params.decimalsOut))
          .catch(e => {
            console.warn(`Failed to get quote from ${provider.getConfig().name}:`, e)
            return null
          })
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