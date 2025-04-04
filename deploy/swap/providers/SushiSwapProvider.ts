import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { address } from "../../types"
import { sleep } from "../../sleep"
import { MAX_SLIPPAGE_BPS } from "./config"

// Doc: https://app.swaggerhub.com/apis/sushi-labs/sushi/5.0.0#/swap/swap
export class SushiSwapProvider implements ISwapProvider {
  private static lastRequest: number = 0
  private static readonly minTime = 1000 // 1 second between requests

  public getConfig(): ProviderConfig {
    return {
      name: "sushiswap",
      enabled: true,
    }
  }

  public async getQuote(params: SwapParams): Promise<SwapResult> {
    const now = Date.now()
    if (now - SushiSwapProvider.lastRequest < SushiSwapProvider.minTime) {
      await sleep(SushiSwapProvider.minTime - now + SushiSwapProvider.lastRequest)
    }

    const url = `https://api.sushi.com/swap/v5/${params.chainId}?tokenIn=${this.toSushi(params.fromToken)}&tokenOut=${this.toSushi(params.toToken)}&amount=${params.swapAmount.toString()}&to=${params.vault}&preferSushi=true&includeTransaction=true&maxSlippage=${MAX_SLIPPAGE_BPS/10000}`
    const res = await fetch(url)
    SushiSwapProvider.lastRequest = Date.now()

    if (res.status !== 200) {
      throw new Error(await res.text())
    }

    const resp = await res.json() as SushiSwapResponse
    if (!resp.tx) {
      throw new Error("No route found")
    }

    return {
      outAmount: BigInt(resp.assumedAmountOut),
      to: resp.tx.to,
      data: resp.tx.data as `0x${string}`,
    }
  }

  private toSushi(token: address): address {
    if (token === "0x0000000000000000000000000000000000000000") {
      return "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" // WETH on Arbitrum
    }
    return token
  }
}

type SushiSwapResponse = {
    assumedAmountOut: string,
    tx?: {
        from: address
        to: address
        data: string
    }
}