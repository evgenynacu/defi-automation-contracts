import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { toAddress, toHex } from "../../types"
import { ReservoirSavingModule__factory, ReservoirSwap__factory } from "../../../typechain-types"
import { reservoirSavingModule, rUSD, srUSD, usdc } from "../../addresses"
import { type ContractRunner } from "ethers"

const reservoirInterface = ReservoirSavingModule__factory.createInterface()
const swapInterface = ReservoirSwap__factory.createInterface()

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
			const outAmount = await calculateOutAmount(params.runner, params.swapAmount)
			const data = reservoirInterface.encodeFunctionData("redeem", [outAmount])

			return {
				to: reservoirSavingModule,
				data: toHex(data),
				outAmount,
			}
		}

		if (params.toToken.toLowerCase() === usdc) {
			const rUsdAmount = await calculateOutAmount(params.runner, params.swapAmount)
			const outAmount = rUsdAmount / (10n ** 12n)

			return {
				to: toAddress("0x4dae3083a3bC2c562d5642dd668d996EAB7Dde12"),
				data: toHex(swapInterface.encodeFunctionData("swapSavingsToUSDC", [params.swapAmount])),
				outAmount,
			}
		}

		throw new Error("toToken is not supported: " + params.toToken)
	}
}

async function calculateOutAmount(runner: ContractRunner, amount: bigint) {
	const module = ReservoirSavingModule__factory.connect(reservoirSavingModule, runner)
	const price = await module.currentPrice()
	const fee = await module.redeemFee()
	return amount * price / (100n * (1000000n + fee))
}
