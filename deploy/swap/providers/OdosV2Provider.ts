import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { address } from "../../types"

export class OdosV2Provider implements ISwapProvider {
  public getConfig(): ProviderConfig {
    return {
      name: "odos-v2",
      enabled: true,
    }
  }

  public async getQuote(params: SwapParams): Promise<SwapResult> {
    const pathId = await this.getPathId(params)
    const assembleBody = {
      "pathId": pathId,
      "simulate": false,
      "userAddr": params.vault
    }

    const res = await fetch("https://api.odos.xyz/sor/assemble", {
      method: "POST",
      body: JSON.stringify(assembleBody),
      headers: {
        "Content-Type": "application/json",
      }
    })

    if (res.status !== 200) {
      throw new Error("Got error while assembling tx: " + await res.text())
    }

    const response = await res.json() as AssembleResponse
    return {
      outAmount: BigInt(response.outputTokens[0].amount),
      to: response.transaction.to,
      data: response.transaction.data,
    }
  }

  private async getPathId(params: SwapParams): Promise<string> {
    const quoteBody = {
      "chainId": params.chainId,
      "inputTokens": [
        {
          "amount": params.swapAmount.toString(),
          "tokenAddress": params.fromToken,
        }
      ],
      "outputTokens": [
        {
          "proportion": 1,
          "tokenAddress": params.toToken,
        }
      ],
      "slippageLimitPercent": 0.5,
      "sourceBlacklist": [],
      "sourceWhitelist": [],
      "userAddr": params.vault
    }

    const res = await fetch("https://api.odos.xyz/sor/quote/v2", {
      method: "POST",
      body: JSON.stringify(quoteBody),
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (res.status !== 200) {
      throw new Error("Got error while getting quote from odos: " + await res.text())
    }

    const quote = await res.json() as QuoteResponse
    if (!quote.pathId) {
      throw new Error("Not found pathId in odos response")
    }

    return quote.pathId
  }
}

type TokenAndAmount = {
  tokenAddress: address
  amount: string
}

type AssembleResponse = {
  outputTokens: Array<TokenAndAmount>
  transaction: {
    to: address
    data: `0x${string}`
  }
}

type QuoteResponse = {
  pathId: string
}