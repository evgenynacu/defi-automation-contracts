import {ISwapProvider} from "./ISwapProvider";
import {ProviderConfig, SwapParams, SwapResult} from "./types";
import {infinifiGateway, siUSD, USDC} from "../../addresses";
import {IInfiniFiGatewayV2__factory, InfinifiSwap__factory} from "../../../typechain-types";
import {AbiCoder, JsonRpcProvider} from "ethers";
import {StateDiff} from "../../types";
import {MAX_SLIPPAGE_BPS} from "./config";

const SWAP = "0x04857184e30A1AD4B03F79379CCEf339A9E15b1F"

export class InfinifiProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "infinifi",
			enabled: true,
		}
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		if (params.fromToken.toLowerCase() == USDC.toLowerCase()) {
			if (params.toToken.toLowerCase() != siUSD.toLowerCase()) {
				throw new Error("Only USDC to siUSD is supported now")
			}

			const outAmount = await calculateStakedOut(params)
			const gatewayInterface = IInfiniFiGatewayV2__factory.createInterface()
			return {
				outAmount,
				to: infinifiGateway,
				data: gatewayInterface.encodeFunctionData("mintAndStake", [params.vault, params.swapAmount]) as `0x${string}`,
			}
		}

		if (params.fromToken.toLowerCase() == siUSD.toLowerCase()) {
			if (params.toToken.toLowerCase() != USDC.toLowerCase()) {
				throw new Error("Only siUSD to USDC is supported now")
			}

			const outAmount = await calculateUsdcOut(params)
			const swapInterface = InfinifiSwap__factory.createInterface()
			const minAmount = outAmount * (10000n - BigInt(MAX_SLIPPAGE_BPS)) / 10000n
			if (process.env.DEBUG_INFINIFI) {
				console.log("siUSD to USDC minAmount is", minAmount)
			}
			return {
				outAmount,
				to: SWAP,
				data: swapInterface.encodeFunctionData("unstakeAndRedeemToUsdc", [params.swapAmount, minAmount]) as `0x${string}`,
			}
		}
		throw new Error("Unsupported token from Swap");
	}

	async isUniqueFor(params: SwapParams): Promise<boolean> {
		if (params.fromToken.toLowerCase() == USDC.toLowerCase() && params.toToken.toLowerCase() == siUSD.toLowerCase()) {
			return true
		}
		if (params.fromToken.toLowerCase() == siUSD.toLowerCase() && params.toToken.toLowerCase() == USDC.toLowerCase()) {
			return true
		}
		return Promise.resolve(false);
	}


}

async function calculateUsdcOut(params: SwapParams) {
	const swapInterface = InfinifiSwap__factory.createInterface()
	const calldata = swapInterface.encodeFunctionData("unstakeAndRedeemToUsdc", [params.swapAmount, 0n])
	const from = "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E"
	if (process.env.DEBUG_INFINIFI) {
		const url = `https://dashboard.tenderly.co/${process.env.TENDERLY_USER}/project/simulator/new?stateOverrides=&from=${from}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${SWAP}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`
		console.log("infinifi testing url: \"" + url + "\" ")
	}

	const provider = params.runner.provider as JsonRpcProvider
	const tx = { from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E", to: SWAP, data: calldata }
	const stateDiff: StateDiff = {
		[siUSD]: {
			stateDiff: {
				"0xb52b1119061eafbe39ac0aff9b94823acc0d242b00ce7d76996ab396016e168a": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0xcbce38d2a396df10bbdba0503c72fc20ab34efc98f9cda900b01217a4dfee62d": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
			}
		}
	}
	const result = await provider.send("eth_call", [tx, "latest", stateDiff])
	const coder = new AbiCoder()
	const parsed = coder.decode(["uint256"], result)
	return parsed[0] as bigint
}

async function calculateStakedOut(params: SwapParams) {
	const swapInterface = InfinifiSwap__factory.createInterface()
	const calldata = swapInterface.encodeFunctionData("mintFromUsdcAndStake", [params.swapAmount])
	const from = "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E"
	if (process.env.DEBUG_INFINIFI) {
		const url = `https://dashboard.tenderly.co/${process.env.TENDERLY_USER}/project/simulator/new?stateOverrides=&from=${from}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${SWAP}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`
		console.log("infinifi testing url: \"" + url + "\" ")
	}

	const provider = params.runner.provider as JsonRpcProvider
	const tx = { from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E", to: SWAP, data: calldata }
	const stateDiff: StateDiff = {
		[USDC]: {
			stateDiff: {
				"0x96a32520c1898ca59ac744885b595cb1e35ba67c55f509fdeb07f905d6758fc7": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0x6e2324c72188c90dab855a9ae77483acaec3da153b2cdf4069dcba2ea4716549": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0x8fd9546052e22b47a6622f5bdb403f29901e4ec3ec1eb1be1a925031ec716067": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
			}
		}
	}
	const result = await provider.send("eth_call", [tx, "latest", stateDiff])
	const coder = new AbiCoder()
	const parsed = coder.decode(["uint256"], result)
	return parsed[0] as bigint
}