import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { address } from "../../types"
import process from "process"
import { sleep } from "../../sleep"
import { MAX_SLIPPAGE_BPS } from "./config"

export class OneInchProvider implements ISwapProvider {
  private static lastRequest: number = 0
  private static readonly minTime = 1200
  private static readonly oneInchAddress: address = "0x111111125421cA6dc452d289314280a0f8842A65"

  public getConfig(): ProviderConfig {
    return {
      name: "1inch",
      enabled: true,
    }
  }

  public async getQuote(params: SwapParams): Promise<SwapResult> {
    const now = Date.now()
    if (now - OneInchProvider.lastRequest < OneInchProvider.minTime) {
      await sleep(OneInchProvider.minTime - now + OneInchProvider.lastRequest)
    }

    const url = `https://api.1inch.dev/swap/v6.0/${params.chainId}/swap?src=${this.toOneInch(params.fromToken)}&dst=${this.toOneInch(params.toToken)}&amount=${params.swapAmount.toString()}&from=${params.vault}&origin=${params.txOrigin}&slippage=${MAX_SLIPPAGE_BPS/100}&disableEstimate=${true}`
    const res = await fetch(url, { headers: { "Authorization": "Bearer " + process.env.ONEINCH_KEY }})
    OneInchProvider.lastRequest = Date.now()

    if (res.status !== 200) {
      throw new Error(await res.text())
    }

    const resp = await res.json() as OneInchSwapResponse
    return {
      outAmount: BigInt(resp.dstAmount),
      to: OneInchProvider.oneInchAddress,
      data: resp.tx.data,
    }
  }

  private toOneInch(token: address): address {
    if (token === "0x0000000000000000000000000000000000000000") {
      return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    }
    return token
  }
}

type OneInchSwapResponse = {
  dstAmount: string
  tx: {
    data: `0x${string}`
  }
}