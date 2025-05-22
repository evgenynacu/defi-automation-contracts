import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { address, toAddress, toHex } from "../../types"
import { ReservoirSavingModule__factory } from "../../../typechain-types"

const rUSD: address = toAddress("0x09D4214C03D01F49544C0448DBE3A27f768F2b34".toLowerCase())
const srUSD: address = toAddress("0x738d1115b90efa71ae468f1287fc864775e23a31".toLowerCase())
const savingModule: address = toAddress("0x5475611Dffb8ef4d697Ae39df9395513b6E947d7")
const reservoirInterface = ReservoirSavingModule__factory.createInterface()

export class ReservoirProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "reservoir",
			enabled: true,
		}
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		if (params.fromToken.toLowerCase() !== srUSD) {
			throw new Error("only from srUSD is supported")
		}

		if (params.toToken.toLowerCase() === rUSD) {
			console.log("redeeming srUSD")
			const module = ReservoirSavingModule__factory.connect(savingModule, params.runner)
			const price = await module.currentPrice()
			const fee = await module.redeemFee()
			const outAmount = (params.swapAmount * price / 100000000n) * (1000000n - fee) / 1000000n
			try {
				const data = reservoirInterface.encodeFunctionData("redeem", [outAmount])

				return {
					to: savingModule,
					data: toHex(data),
					outAmount,
				}
			} catch (e) {
				console.error(e)
				throw e
			}
		}

		throw new Error("toToken is not supported: " + params.toToken)
	}
}
