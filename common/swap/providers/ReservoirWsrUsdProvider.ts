import { ISwapProvider } from "./ISwapProvider";
import { ProviderConfig, SwapParams, SwapResult } from "./types";
import { USDC, wsrUSD } from "../../addresses";
import { ReservoirWsrUsdZap__factory } from "../../../typechain-types";
import { AbiCoder, JsonRpcProvider } from "ethers";
import { StateDiff } from "../../types";
import { MAX_SLIPPAGE_BPS } from "./config";

// Адрес твоего zap-контракта
const ZAP = "0xfB9fc1Faf53b794472CebbC0A04aa390aFb642de";

const FROM = "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E";

export class ReservoirWsrUsdProvider implements ISwapProvider {
	getConfig(): ProviderConfig {
		return {
			name: "reservoir-wsrusd",
			enabled: true,
		};
	}

	async getQuote(params: SwapParams): Promise<SwapResult> {
		// USDC -> wsrUSD
		if (params.fromToken.toLowerCase() === USDC.toLowerCase()) {
			if (params.toToken.toLowerCase() !== wsrUSD.toLowerCase()) {
				throw new Error("Only USDC to wsrUSD is supported now");
			}

			const outAmount = await calculateWsrUsdOut(params);

			const zapInterface = ReservoirWsrUsdZap__factory.createInterface();
			const minShares =
				(outAmount * (10_000n - BigInt(MAX_SLIPPAGE_BPS))) / 10_000n;

			if (process.env.DEBUG_RESERVOIR) {
				console.log("USDC -> wsrUSD minShares is", minShares.toString());
			}

			return {
				outAmount,
				to: ZAP,
				data: zapInterface.encodeFunctionData("swapUSDCToWsrUSD", [
					params.swapAmount,
					minShares,
				]) as `0x${string}`,
			};
		}

		// wsrUSD -> USDC
		if (params.fromToken.toLowerCase() === wsrUSD.toLowerCase()) {
			if (params.toToken.toLowerCase() !== USDC.toLowerCase()) {
				throw new Error("Only wsrUSD to USDC is supported now");
			}

			const outAmount = await calculateUsdcOut(params);

			const zapInterface = ReservoirWsrUsdZap__factory.createInterface();
			const minUsdc =
				(outAmount * (10_000n - BigInt(MAX_SLIPPAGE_BPS))) / 10_000n;

			if (process.env.DEBUG_RESERVOIR) {
				console.log("wsrUSD -> USDC minUsdc is", minUsdc.toString());
			}

			return {
				outAmount,
				to: ZAP,
				data: zapInterface.encodeFunctionData("swapWsrUSDToUSDC", [
					params.swapAmount,
					minUsdc,
				]) as `0x${string}`,
			};
		}

		throw new Error("Unsupported token pair for ReservoirWsrUsdProvider");
	}

	async isUniqueFor(params: SwapParams): Promise<boolean> {
		if (
			params.fromToken.toLowerCase() === USDC.toLowerCase() &&
			params.toToken.toLowerCase() === wsrUSD.toLowerCase()
		) {
			return true;
		}

		if (
			params.fromToken.toLowerCase() === wsrUSD.toLowerCase() &&
			params.toToken.toLowerCase() === USDC.toLowerCase()
		) {
			return true;
		}

		return false;
	}
}

// ----------------- helpers -----------------

async function calculateWsrUsdOut(params: SwapParams): Promise<bigint> {
	const zapInterface = ReservoirWsrUsdZap__factory.createInterface();

	const calldata = zapInterface.encodeFunctionData("swapUSDCToWsrUSD", [
		params.swapAmount,
		0n, // minShares = 0, нас интересует реальный out, который вернёт контракт
	]);

	if (process.env.DEBUG_RESERVOIR) {
		const url = `https://dashboard.tenderly.co/${process.env.TENDERLY_USER}/project/simulator/new?stateOverrides=&from=${FROM}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${ZAP}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`;
		console.log('reservoir wsrUSD testing url (USDC->wsrUSD): "' + url + '" ');
	}

	const provider = params.runner.provider as JsonRpcProvider;

	const tx = {
		from: FROM,
		to: ZAP,
		data: calldata,
	};

	const stateDiff: StateDiff = {
		[USDC]: {
			stateDiff: {
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

async function calculateUsdcOut(params: SwapParams): Promise<bigint> {
	const zapInterface = ReservoirWsrUsdZap__factory.createInterface();

	const calldata = zapInterface.encodeFunctionData("swapWsrUSDToUSDC", [
		params.swapAmount,
		0n, // minUsdc = 0
	]);

	if (process.env.DEBUG_RESERVOIR) {
		const url = `https://dashboard.tenderly.co/${process.env.TENDERLY_USER}/project/simulator/new?stateOverrides=&from=${FROM}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${ZAP}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`;
		console.log('reservoir wsrUSD testing url (wsrUSD->USDC): "' + url + '" ');
	}

	const provider = params.runner.provider as JsonRpcProvider;

	const tx = {
		from: FROM,
		to: ZAP,
		data: calldata,
	};

	const stateDiff: StateDiff = {
		[wsrUSD]: {
			stateDiff: {
				"0x18388d40bc4583106a1887f14c02c787799250386161dbf0e6f0d681eb03bfb3": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
				"0x04f57dd85ec5e81f7372eb95c7ed0161bd7e95fa724be8f8aeee3a93b24598cf": "0x000000000000000000000000000ff00000000000000000006404586861f96590",
			},
		},
	};

	const result = await provider.send("eth_call", [tx, "latest", stateDiff]);

	const coder = new AbiCoder();
	const parsed = coder.decode(["uint256"], result); // returns (uint256 usdcOut)
	return parsed[0] as bigint;
}
