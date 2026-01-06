import {ISwapProvider} from "./ISwapProvider";
import {ProviderConfig, SwapParams, SwapResult} from "./types";
import {USDC, wsrUSD} from "../../addresses";
import {ReservoirWsrUsdZap__factory} from "../../../typechain-types";
import {AbiCoder, JsonRpcProvider} from "ethers";
import {StateDiff} from "../../types";
import {MAX_SLIPPAGE_BPS} from "./config";
import {KyberSwapProvider} from "./KyberSwapProvider";

const ZAP = "0xbba59d46Bb857dC16E06c22a59a8f250F23A8f7C";

const FROM = "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export class ReservoirWsrUsdProvider implements ISwapProvider {
	private swapProvider: ISwapProvider;

	constructor() {
		// We use Odos to build calldata for the optional extra swap step inside the zap.
		this.swapProvider = new KyberSwapProvider();
	}


	getConfig(): ProviderConfig {
		return {
			name: "reservoir-wsrusd",
			enabled: true,
		};
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		const zapInterface = ReservoirWsrUsdZap__factory.createInterface();

		const fromTokenLc = params.fromToken.toLowerCase();
		const toTokenLc = params.toToken.toLowerCase();

		// tokenIn -> wsrUSD
		if (toTokenLc === wsrUSD.toLowerCase()) {
			let swapRouter = ZERO_ADDRESS;
			let swapData = "0x";

			// For expected outAmount, we simulate only the USDC->wsrUSD leg via eth_call.
			// If tokenIn != USDC, we first get an Odos quote (tokenIn->USDC) to estimate the USDC amount.
			let expectedUsdcIn: bigint;
			if (fromTokenLc !== USDC.toLowerCase()) {
				const swapQuote = await this.swapProvider.getQuote({
					...params,
					vault: ZAP,
					toToken: USDC,
					decimalsOut: 6,
				});
				swapRouter = swapQuote.to;
				swapData = swapQuote.data;
				expectedUsdcIn = swapQuote.outAmount;
			} else {
				expectedUsdcIn = params.swapAmount;
			}

			const expectedSharesOut = await calculateWsrUsdOut(params.runner.provider as JsonRpcProvider, params.chainId, expectedUsdcIn);
			const minShares = getMinAmount(expectedSharesOut);

			const calldata = zapInterface.encodeFunctionData("swapToWsrUSD", [
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

		// wsrUSD -> tokenOut
		if (fromTokenLc === wsrUSD.toLowerCase()) {
			let swapRouter = ZERO_ADDRESS;
			let swapData = "0x";

			// First, estimate USDC out from wsrUSD shares via eth_call (wsrUSD->USDC leg).
			const expectedUsdcOut = await calculateUsdcOut(params.runner.provider as JsonRpcProvider, params.chainId, params.swapAmount);
			if (process.env.DEBUG_RESERVOIR)
				console.log("expectedUsdcOut is", expectedUsdcOut);

			let expectedTokenOut: bigint;
			if (toTokenLc !== USDC.toLowerCase()) {
				// Then, estimate tokenOut via Odos quote (USDC->tokenOut) where the zap is the receiver.
				const newParams: SwapParams = {
					...params,
					vault: ZAP,
					fromToken: USDC,
					decimalsIn: 6,
					swapAmount: expectedUsdcOut,
				}
				if (process.env.DEBUG_RESERVOIR) {
					console.log("newParams is", newParams);
				}
				const swapQuote = await this.swapProvider.getQuote(newParams);
				swapRouter = swapQuote.to;
				swapData = swapQuote.data;
				expectedTokenOut = swapQuote.outAmount;
				if (process.env.DEBUG_RESERVOIR) {
					console.log("expectedTokenOut is", expectedTokenOut);
				}
			} else {
				expectedTokenOut = expectedUsdcOut;
			}

			const minOutTokenAmount = getMinAmount(expectedTokenOut);

			const calldata = zapInterface.encodeFunctionData("swapWsrUSDTo", [
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

		throw new Error("ReservoirWsrUsdProvider supports only swaps to or from wsrUSD");
	}

	async isUniqueFor(params: SwapParams): Promise<boolean> {
		return params.fromToken.toLowerCase() === wsrUSD.toLowerCase() || params.toToken.toLowerCase() === wsrUSD.toLowerCase();
	}
}

function getMinAmount(amount: bigint) {
	return (amount * (10_000n - BigInt(MAX_SLIPPAGE_BPS))) / 10_000n;
}

// ----------------- helpers -----------------

async function calculateWsrUsdOut(provider: JsonRpcProvider, chainId: number, usdcAmount: bigint): Promise<bigint> {
	const zapInterface = ReservoirWsrUsdZap__factory.createInterface();

	// Simulate USDC -> wsrUSD inside the zap (no extra swap leg).
	const calldata = zapInterface.encodeFunctionData("swapToWsrUSD", [
		USDC,
		ZERO_ADDRESS,
		"0x",
		usdcAmount,
		0n, // minShares = 0, we want the real out amount returned by the contract
	]);

	if (process.env.DEBUG_RESERVOIR) {
		const url = `https://dashboard.tenderly.co/${process.env.TENDERLY_USER}/project/simulator/new?stateOverrides=&from=${FROM}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${ZAP}&contractFunction=&functionInputs=&network=${chainId}&headerBlockNumber=&headerTimestamp=`;
		console.log('reservoir wsrUSD testing url (USDC->wsrUSD): "' + url + '" ');
	}

	const tx = {
		from: FROM,
		to: ZAP,
		data: calldata,
	};

	// Tenderly-style state override to give FROM a large USDC balance / allowance for eth_call.
	// Keep this as-is (works for the USDC leg). We intentionally do NOT try to override arbitrary ERC20 storage.
	const stateDiff: StateDiff = {
		[USDC]: {
			stateDiff: {
				"0xaff8617dc61dcf3ba8c43d9aae6b9e5fd479a083c4b6883426bbc492e406f431": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0x934222360bf4c5461f1a09271f3f9641790af907f9d1d17f7100de539e0670c0": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0x0ba13bcb1dce3e61115f066f9ffaa935109f9c0a2409c543ca7351eaa0f5ceea": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0x6e2324c72188c90dab855a9ae77483acaec3da153b2cdf4069dcba2ea4716549": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
			},
		},
	};

	const result = await provider.send("eth_call", [tx, "latest", stateDiff]);

	const coder = new AbiCoder();
	const parsed = coder.decode(["uint256"], result); // returns (uint256 sharesOut)
	return parsed[0] as bigint;
}

async function calculateUsdcOut(provider: JsonRpcProvider, chainId: number, shares: bigint): Promise<bigint> {
	const zapInterface = ReservoirWsrUsdZap__factory.createInterface();

	// Simulate wsrUSD -> USDC inside the zap (no extra swap leg).
	const calldata = zapInterface.encodeFunctionData("swapWsrUSDTo", [
		USDC,
		ZERO_ADDRESS,
		"0x",
		shares,
		0n, // minOutTokenAmount = 0, we want the real out amount returned by the contract
	]);

	if (process.env.DEBUG_RESERVOIR) {
		const url = `https://dashboard.tenderly.co/${process.env.TENDERLY_USER}/project/simulator/new?stateOverrides=&from=${FROM}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${ZAP}&contractFunction=&functionInputs=&network=${chainId}&headerBlockNumber=&headerTimestamp=`;
		console.log('reservoir wsrUSD testing url (wsrUSD->USDC): "' + url + '" ');
	}

	const tx = {
		from: FROM,
		to: ZAP,
		data: calldata,
	};

	// Tenderly-style state override to give FROM a large wsrUSD balance / allowance for eth_call.
	const stateDiff: StateDiff = {
		[wsrUSD]: {
			stateDiff: {
				"0xbb4355aff4eff04cc7705c243ed503cfd874b41e32939919ac6d02dad0941d2a": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0x04f57dd85ec5e81f7372eb95c7ed0161bd7e95fa724be8f8aeee3a93b24598cf": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0x18388d40bc4583106a1887f14c02c787799250386161dbf0e6f0d681eb03bfb3": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
			},
		},
	};

	const result = await provider.send("eth_call", [tx, "latest", stateDiff]);

	const coder = new AbiCoder();
	const parsed = coder.decode(["uint256"], result); // returns (uint256 tokenOutAmount)
	return parsed[0] as bigint;
}