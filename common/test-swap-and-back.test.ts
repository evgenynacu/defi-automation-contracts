import {testSwapAndBack} from "./test-swap-and-back";
import {
	PT_cUSD_JAN_26,
	PT_srUSDe_JAN_26,
	PT_stcUSD_JAN_26,
	siUSD,
	stcUSD, sUSDS,
	USDC,
	USDT_ADDRESS,
	wsrUSD
} from "./addresses";

describe("testSwapAndBack", () => {
	it("should swap stcUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, 100000000000n, stcUSD)) // 0.1 %
	})

	it("should swap PT-stcUSD-JAN26 to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, 100000000000n, PT_stcUSD_JAN_26)) // 0.182 %
	})

	it("should swap PT-cUSD-JAN26 to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, 100000000000n, PT_cUSD_JAN_26)) // 0.193 %
	})

	it("should swap siUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, 1000000000000n, siUSD)) // 42 % TODO fix siUSD convert
	})

	it("should swap wsrUSD to USDT and back", async () => {
		console.log(await testSwapAndBack(USDT_ADDRESS, 10000000000n, wsrUSD)) // 0 % !!!
		//todo can we use other way here? through usdc?
	})

	it("should swap wsrUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, 10000000000n, wsrUSD)) // 0.3 %
	})

	it("should swap PT-srUSDe-JAN26 to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, 100000000000n, PT_srUSDe_JAN_26)) // 0.2%
	})

	it("should swap sUSDS to USDT and back", async () => {
		console.log(await testSwapAndBack(USDT_ADDRESS, 100000000000n, sUSDS)) // 0.000381 %
	})

	const t = {
		"chainId": 1,
		"from": "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
		"to": "0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5",
		"data": "0x230ae89c000000000000000000000000089fa9741628c1a4576f5ba47e02d1180b581e3600000000000000000000000000000000000000000000000000000000000f4240",
		"gas": "0xda05e",
		"maxFeePerGas": "0x22f3c100",
		"maxPriorityFeePerGas": "0x22f3c100",
		"nonce": "0x8f"
	}

	// reUSD: too low liqudity
	// F-ONE: requires KYC + losses ~ 1%
	// thBILL: too low liquidity
})