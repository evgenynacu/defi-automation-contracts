import { ISwapProvider } from "./ISwapProvider"
import { ProviderConfig, SwapParams, SwapResult } from "./types"
import { toAddress, toHex } from "../../types"
import { ReservoirSavingModule__factory, ReservoirSwap__factory } from "../../../typechain-types"
import { reservoirSavingModule, rUSD, srUSD, USDC } from "../../addresses"
import { type ContractRunner } from "ethers"

const reservoirInterface = ReservoirSavingModule__factory.createInterface()
const swapInterface = ReservoirSwap__factory.createInterface()

const RESERVOIR_SWAP = toAddress("0x78F92Fe8a0672279BB8da3C433730067D8Cf59f9")

export class ReservoirProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "reservoir",
			enabled: true,
		}
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		if (params.toToken.toLowerCase() === srUSD && params.fromToken.toLowerCase() === USDC) {
			return {
				to: RESERVOIR_SWAP,
				data: toHex(swapInterface.encodeFunctionData("swapUSDCToSavings", [params.swapAmount])),
				outAmount: params.swapAmount, //todo it's not 100% correct, though it's not used
			}
		}

		if (params.toToken.toLowerCase() === rUSD) {
			if (params.fromToken.toLowerCase() !== srUSD) {
				throw new Error("only from srUSD is supported")
			}

			const outAmount = await calculateOutAmount(params.runner, params.swapAmount)
			const data = reservoirInterface.encodeFunctionData("redeem", [outAmount])

			return {
				to: reservoirSavingModule,
				data: toHex(data),
				outAmount,
			}
		}

		if (params.toToken.toLowerCase() === USDC) {
			if (params.fromToken.toLowerCase() !== srUSD) {
				throw new Error("only from srUSD is supported")
			}

 			const rUsdAmount = await calculateOutAmount(params.runner, params.swapAmount)
			const outAmount = rUsdAmount / (10n ** 12n)

			return {
				to: RESERVOIR_SWAP,
				data: toHex(swapInterface.encodeFunctionData("swapSavingsToUSDC", [params.swapAmount])),
				outAmount,
			}
		}

		throw new Error("toToken is not supported: " + params.toToken)
	}

	async isUniqueFor(params: SwapParams) {
		if (params.toToken.toLowerCase() === srUSD && params.fromToken.toLowerCase() === USDC) {
			return true
		}
		if (params.toToken.toLowerCase() === rUSD && params.fromToken.toLowerCase() === srUSD) {
			return true
		}
		return params.toToken.toLowerCase() === USDC && params.fromToken.toLowerCase() === srUSD;
	}
}

async function calculateOutAmount(runner: ContractRunner, amount: bigint) {
	const module = ReservoirSavingModule__factory.connect(reservoirSavingModule, runner)
	const price = await module.currentPrice()
	const fee = await module.redeemFee()
	return amount * price / (100n * (1000000n + fee))
}
