import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { address } from "../../types"
import { MAX_SLIPPAGE_BPS } from "./config"

abstract class IcarusProvider implements ISwapProvider {
  protected constructor(
    private readonly name: string,
  ) {}

  public getConfig(): ProviderConfig {
    return {
      name: this.name,
      enabled: true,
    }
  }

  public async getQuote(params: SwapParams): Promise<SwapResult> {
    const url = `https://canoe.v2.icarus.tools/market/${this.name}/swap_quote`
    const body = {
      "chain": chainIdMapping[params.chainId],
      "account": params.vault,
      "inTokenAddress": params.fromToken,
      "outTokenAddress": params.toToken,
      "isExactIn": true,
      "slippage": MAX_SLIPPAGE_BPS, // Icarus expects slippage in basis points
      "inTokenAmount": formatAmount(params.swapAmount, params.decimalsIn),
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.status !== 200) {
      throw new Error("Got error while getting quote from icarus: " + await res.text())
    }

    const resp = await res.json() as IcarusResponse
    return {
      outAmount: BigInt(Math.floor(parseFloat(resp.outAmount) * 10 ** params.decimalsOut)),
      to: resp.candidateTrade.to,
      data: resp.candidateTrade.data,
    }
  }
}

type IcarusResponse = {
  outAmount: string
  candidateTrade: {
    to: address
    data: `0x${string}`
  }
}

export class EnsoProvider extends IcarusProvider {
  constructor() {
    super("enso")
  }
}

export class KyberSwapIcarusProvider extends IcarusProvider {
  constructor() {
    super("kyberswap")
  }
}

export class OkxProvider extends IcarusProvider {
  constructor() {
    super("okx")
  }
}

export class OpenoceanProvider extends IcarusProvider {
  constructor() {
    super("openocean")
  }
}

export class VeloraProvider extends IcarusProvider {
  constructor() {
    super("velora")
  }
}

export class UnizenProvider extends IcarusProvider {
  constructor() {
    super("unizen")
  }
}

export class UsorProvider extends IcarusProvider {
  constructor() {
    super("usor")
  }
}

export class ZeroexProvider extends IcarusProvider {
  constructor() {
    super("zeroex")
  }
}

const chainIdMapping: Record<number, string> = {
  1: "mainnet",
  42161: "arbitrum",
}

function formatAmount(amount: bigint, decimals: number | bigint): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;

  let fractionalStr = fractionalPart.toString();
  fractionalStr = fractionalStr.padStart(Number(decimals), '0');

  fractionalStr = fractionalStr.replace(/0+$/, '');

  if (fractionalStr === '') {
    return integerPart.toString();
  }

  return `${integerPart}.${fractionalStr}`;
}
