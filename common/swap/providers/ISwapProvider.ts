import { SwapParams, SwapResult, ProviderConfig } from "./types"

export interface ISwapProvider {
  /**
   * Get provider configuration
   */
  getConfig(): ProviderConfig

  /**
   * Get swap quote and transaction data
   * @throws Error if quote cannot be obtained
   */
  getQuote(params: SwapParams): Promise<SwapResult>

  /**
   * Checks if this is a unique provider for executing the swap (e.g. PT tokens are swapped only using Pendle)
   */
  isUniqueFor(params: SwapParams): Promise<boolean>
}