import {ISwapProvider} from "./ISwapProvider";
import {ProviderConfig, SwapParams, SwapResult} from "./types";
import {sUSDS, USDS} from "../../addresses";
import {ISusds__factory, SusdsZap__factory} from "../../../typechain-types";
import {MAX_SLIPPAGE_BPS} from "./config";
import {address} from "../../types";
import {OdosV2Provider} from "./OdosV2Provider";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Address of the deployed SusdsZap contract. Fill in after deployment.
// While it is the zero address the provider stays inert (see isUniqueFor / getQuote),
// so it never hijacks sUSDS routes that other providers could still serve.
const ZAP: address = "0x59861902DBb8c7baaD4Af69bfBF9c4170584f43A";

const ZAP_DEPLOYED = ZAP !== ZERO_ADDRESS;

/**
 * Native sUSDS zap provider.
 *  - tokenIn -> sUSDS: tokenIn -> USDS (aggregator) -> sUSDS (native ERC4626 deposit)
 *  - sUSDS -> tokenOut: sUSDS -> USDS (native ERC4626 redeem) -> tokenOut (aggregator)
 * Mirrors ReservoirWsrUsdProvider. sUSDS is a standard ERC4626 whose asset is USDS,
 * so the sUSDS leg is quoted directly via previewDeposit / previewRedeem (no simulation).
 */
export class SusdsProvider implements ISwapProvider {
	// Aggregator used to build calldata for the tokenIn<->USDS leg inside the zap.
	private swapProvider: ISwapProvider = new OdosV2Provider();

	getConfig(): ProviderConfig {
		return {
			name: "susds",
			enabled: true,
		};
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		if (!ZAP_DEPLOYED) {
			throw new Error("SusdsProvider: SusdsZap address is not configured");
		}

		const zapInterface = SusdsZap__factory.createInterface();
		const susds = ISusds__factory.connect(sUSDS, params.runner);

		const fromTokenLc = params.fromToken.toLowerCase();
		const toTokenLc = params.toToken.toLowerCase();

		// tokenIn -> sUSDS
		if (toTokenLc === sUSDS.toLowerCase()) {
			let swapRouter = ZERO_ADDRESS;
			let swapData = "0x";

			let expectedUsdsIn: bigint;
			if (fromTokenLc !== USDS.toLowerCase()) {
				const swapQuote = await this.swapProvider.getQuote({
					...params,
					vault: ZAP,
					toToken: USDS,
					decimalsOut: 18,
				});
				swapRouter = swapQuote.to;
				swapData = swapQuote.data;
				expectedUsdsIn = swapQuote.outAmount;
			} else {
				expectedUsdsIn = params.swapAmount;
			}

			const expectedSharesOut = await susds.previewDeposit(expectedUsdsIn);
			const minShares = getMinAmount(expectedSharesOut);

			const calldata = zapInterface.encodeFunctionData("swapToSUSDS", [
				params.fromToken,
				swapRouter,
				swapData,
				params.swapAmount,
				minShares,
			]);

			return {
				to: ZAP,
				data: calldata as `0x${string}`,
				outAmount: expectedSharesOut,
			};
		}

		// sUSDS -> tokenOut
		if (fromTokenLc === sUSDS.toLowerCase()) {
			let swapRouter = ZERO_ADDRESS;
			let swapData = "0x";

			const expectedUsdsOut = await susds.previewRedeem(params.swapAmount);

			let expectedTokenOut: bigint;
			if (toTokenLc !== USDS.toLowerCase()) {
				const swapQuote = await this.swapProvider.getQuote({
					...params,
					vault: ZAP,
					fromToken: USDS,
					decimalsIn: 18,
					swapAmount: expectedUsdsOut,
				});
				swapRouter = swapQuote.to;
				swapData = swapQuote.data;
				expectedTokenOut = swapQuote.outAmount;
			} else {
				expectedTokenOut = expectedUsdsOut;
			}

			const minOutTokenAmount = getMinAmount(expectedTokenOut);

			const calldata = zapInterface.encodeFunctionData("swapSUSDSTo", [
				params.toToken,
				swapRouter,
				swapData,
				params.swapAmount,
				minOutTokenAmount,
			]);

			return {
				to: ZAP,
				data: calldata as `0x${string}`,
				outAmount: expectedTokenOut,
			};
		}

		throw new Error("SusdsProvider supports only swaps to or from sUSDS");
	}

	async isUniqueFor(params: SwapParams): Promise<boolean> {
		if (!ZAP_DEPLOYED) {
			return false;
		}
		return params.fromToken.toLowerCase() === sUSDS.toLowerCase() || params.toToken.toLowerCase() === sUSDS.toLowerCase();
	}
}

function getMinAmount(amount: bigint) {
	return (amount * (10_000n - BigInt(MAX_SLIPPAGE_BPS))) / 10_000n;
}
