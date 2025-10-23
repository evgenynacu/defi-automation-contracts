import {ISwapProvider} from "./ISwapProvider"
import {ProviderConfig, SwapParams, SwapResult} from "./types"
import {toHex} from "../../types"
import {ISrUSDe__factory, IStrataStrategy__factory, StrataSwap__factory,} from "../../../typechain-types"
import {PT_srUSDe_JAN, srUSDe_ADDRESS, STRATA_SWAP, sUSDe_ADDRESS,} from "../../addresses"
import {PendleProvider} from "./PendleProvider"
import {OdosV2Provider} from "./OdosV2Provider";
import {MAX_SLIPPAGE_BPS} from "./config";

const strataSwapInterface = StrataSwap__factory.createInterface()

// Strata Strategy contract address
const STRATA_STRATEGY = "0xdbf4FB6C310C1C85D0b41B5DbCA06096F2E7099F"

export class StrataSwapProvider implements ISwapProvider {
	private pendleProvider: PendleProvider
	private finalSwapProvider: ISwapProvider

	constructor() {
		this.pendleProvider = new PendleProvider()
		this.finalSwapProvider = new OdosV2Provider()
	}

	getConfig(): ProviderConfig {
		return {
			name: "strata-swap",
			enabled: true,
		}
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		// Check if this is a PT-srUSDe token
		if (!this.isPTsrUSDeToken(params.fromToken)) {
			throw new Error("StrataSwap only supports PT-srUSDe tokens as input")
		}

		// Step 1: Get Pendle swap data (PT-srUSDe -> srUSDe) using PendleProvider
		const pendleSwapResult = await this.pendleProvider.getQuote({
			...params,
			vault: STRATA_SWAP,
			toToken: srUSDe_ADDRESS,
		})

		console.log("srUSDe amount should be", pendleSwapResult.outAmount)

		// Step 2: Calculate exact sUSDe amount after redeem from srUSDe
		const sUSDeAmount = await this.calculateSUSDeAmount(
			pendleSwapResult.outAmount,
			params.runner
		)
		console.log("sUSDe amount should be", sUSDeAmount)

		// Step 3: Get final swap data (sUSDe -> toToken) via KyberSwapProvider
		const finalSwapResult = await this.finalSwapProvider.getQuote({
			...params,
			fromToken: sUSDe_ADDRESS,
			swapAmount: sUSDeAmount,
			vault: STRATA_SWAP,
		})



		// Step 4: Encode the StrataSwap contract call
		const data = strataSwapInterface.encodeFunctionData("swap", [
			params.fromToken, // ptToken
			params.swapAmount, // ptAmount
			pendleSwapResult.data, // pendleSwapData
			finalSwapResult.to, // finalSwapRouter
			finalSwapResult.data, // finalSwapData
			params.toToken, // finalToken
			getMinAmount(finalSwapResult.outAmount), // minFinalOutput
		])

		return {
			// Note: swapRouter is ignored by StrataSwapStrategy, so we can pass any address
			// The strategy always uses the strataSwap contract address from its constructor
			to: "0x0000000000000000000000000000000000000000",
			data: toHex(data),
			outAmount: finalSwapResult.outAmount,
		}
	}

	private async calculateSUSDeAmount(srUSDeAmount: bigint, runner: any): Promise<bigint> {
		const srUSDe = ISrUSDe__factory.connect(srUSDe_ADDRESS, runner)
		const strategy = IStrataStrategy__factory.connect(STRATA_STRATEGY, runner)

		const baseAssets = await srUSDe.previewRedeem(srUSDeAmount)
		return await strategy.convertToTokens(sUSDe_ADDRESS, baseAssets, 1)
	}

	async isUniqueFor(params: SwapParams): Promise<boolean> {
		// This provider is unique for PT-srUSDe tokens
		return this.isPTsrUSDeToken(params.fromToken)
	}

	private isPTsrUSDeToken(token: string): boolean {
		return PT_srUSDe_JAN.toLowerCase() == token.toLowerCase()
	}
}

function getMinAmount(amount: bigint) {
	return amount * (10000n - BigInt(MAX_SLIPPAGE_BPS)) / 10000n
}

/*
187133653199811190055447
186644363322963889287089n
 */