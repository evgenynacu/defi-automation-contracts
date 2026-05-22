import {testSwapAndBack} from "./test-swap-and-back";
import {
	cUSD, GHO,
	PT_cUSD_JAN_26,
	PT_reUSD_25JUN2026, PT_sNUSD_5MAR2026,
	PT_srUSDe_JAN_26,
	PT_stcUSD_JAN_26, PT_sUSDe_7MAY2026,
	PT_sUSDe_FEB26,
	PT_thBILL_19FEB2026,
	PYUSD,
	siUSD,
	stcUSD, sUSDD,
	sUSDe_ADDRESS,
	sUSDS, SYRUP_USDT,
	USDC,
	USDC_ARB,
	USDe_ADDRESS,
	USDT_ADDRESS, USDtb,
	wsrUSD
} from "./addresses";

const k100_18 = 100000000000000000000000n;
const k100_6 = 100000000000n;
const m1_18 = 1000000000000000000000000n;
const m1_6 = 1000000000000n;

describe("testSwapAndBack", () => {
	it("should swap stcUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, k100_6, stcUSD)) // 0.1 %
	})

	it("should swap cUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, k100_6, cUSD)) // 0.1 %
	})

	it("should swap PT-stcUSD-JAN26 to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, k100_6, PT_stcUSD_JAN_26)) // 0.182 %
	})

	it("should swap PT-cUSD-JAN26 to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, k100_6, PT_cUSD_JAN_26)) // 0.193 %
	})

	it("should swap siUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, m1_6, siUSD)) //  0 % !!!
	})

	it("should swap wsrUSD to USDT and back", async () => {
		console.log(await testSwapAndBack(USDT_ADDRESS, k100_6, wsrUSD)) // 0.6 %
		//todo can we use other way here? through usdc?
	})

	it("should swap wsrUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, k100_6, wsrUSD)) // 0 % !!!
	})

	it("should swap PT-srUSDe-JAN26 to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, k100_6, PT_srUSDe_JAN_26)) // 0.2%
	})

	it("should swap sUSDS to USDT and back", async () => {
		console.log(await testSwapAndBack(USDT_ADDRESS, 10n * k100_6, sUSDS)) // 0.000381 %
	})

	it("should swap USDe to PT-sUSDe-FEB25 and back", async () => {
		console.log(await testSwapAndBack(USDe_ADDRESS, k100_18, PT_sUSDe_FEB26)) // 0.0385% !!!
	})

	it("should swap USDe to PT-sUSDe-07MAY26 and back", async () => {
		console.log(await testSwapAndBack(USDe_ADDRESS, 2n * k100_18, PT_sUSDe_7MAY2026)) // 0.05767500000000148% 200k -> 0.63%
	})

	it("should swap PYUSD to sUSDe and back", async () => {
		console.log(await testSwapAndBack(PYUSD, k100_6, sUSDe_ADDRESS)) // 0.015% !!!
	})

	it("should swap PYUSD to USDC and back", async () => {
		console.log(await testSwapAndBack(PYUSD, k100_6, USDC)) // 0.015% !!!
	})

	it("should swap PYUSD to sUSDS and back", async () => {
		console.log(await testSwapAndBack(PYUSD, k100_6, sUSDS)) // TODO
	})

	it("should swap PT-reUSD-25JUN2026 to USDC and back", async () => {
		console.log(await testSwapAndBack(USDC, k100_6, PT_reUSD_25JUN2026)) // 0.43% too much
	})

	it("should swap PT-sNUSD-5MAR2026 to USDC and back", async () => {
		//todo recheck
		console.log(await testSwapAndBack(USDC, k100_6, PT_sNUSD_5MAR2026)) // sNUSD is not possible to convert from
	})

	it("should swap PT-thBILL to USDC and back on Arbitrum", async () => {
		console.log(await testSwapAndBack(USDC_ARB, k100_6, PT_thBILL_19FEB2026, 42161)) // 0.1%
	})

	it("should swap GHO to syrupUSDT and back", async () => {
		console.log(await testSwapAndBack(GHO, k100_18, SYRUP_USDT)) // 0.14378%
	})

	it("should swap USDT to syrupUSDT and back", async () => {
		console.log(await testSwapAndBack(USDT_ADDRESS, k100_6, SYRUP_USDT)) // 0.139959%
	})

	it("should swap USDT to sUSDD and back", async () => {
		console.log(await testSwapAndBack(USDT_ADDRESS, k100_6, sUSDD)) // 0%!!!!
	})

	it("should swap USDC to USDe and back", async () => {
		console.log(await testSwapAndBack(USDC, m1_6, USDe_ADDRESS)) // 0%!!!!
	})

	it("should swap USDtb to sUSDe and back", async () => {
		console.log(await testSwapAndBack(USDtb, m1_18, sUSDe_ADDRESS)) // 100k = 0.037%!!!! 1m = 0.078%
	})


	// reUSD: too low liqudity
	// F-ONE: requires KYC + losses ~ 1%
	// thBILL: too low liquidity
})