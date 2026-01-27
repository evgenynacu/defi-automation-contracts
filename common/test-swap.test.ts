import { testSwap } from "./test-swap"
import {
	DAI_ADDRESS, GHO, PT_thBILL_19FEB2026,
	SDAI_ADDRESS,
	sUSDe_ADDRESS,
	SYRUP_USDC, SYRUP_USDT,
	USDC, USDC_ARB,
	USDe_ADDRESS, USDT_ADDRESS,
	WEETH_ADDRESS,
	WETH_ADDRESS, wsrUSD,
	WSTETH_ADDRESS
} from "./addresses"
import { describe, it } from "mocha"

describe("Test Swap", () => {
	it("should try and swap weETH", async () => {
		const out = await testSwap(WEETH_ADDRESS, 100000000000000000000n, WETH_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap wstETH", async () => {
		const out = await testSwap(WSTETH_ADDRESS, 100000000000000000000n, WETH_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap WETH", async () => {
		const out = await testSwap(WETH_ADDRESS, 100000000000000000000n, WSTETH_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap USDe->sUSDe", async () => {
		const out = await testSwap(USDe_ADDRESS, 100000000000000000000000n, sUSDe_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap USDe->sUSDe 22", async () => {
		const out = await testSwap(USDe_ADDRESS, 109929421872202560569n, sUSDe_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap sUSDe->USDe", async () => {
		const out = await testSwap(sUSDe_ADDRESS, 100000000000000000000000n, USDe_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap sUSDe->USDC", async () => {
		const result = await testSwap(sUSDe_ADDRESS, 100000000000000000000000n, USDC)

		console.log("result is", result)
		const mul = 1000000000
		const rate = Number(result * BigInt(mul) * (10n ** 12n)/ 100000000000000000000000n) / mul

		console.log("value is", rate)
	})

	it("should try and swap USDC->sUSDe", async () => {
		const result = await testSwap(USDC, 100000000000n, sUSDe_ADDRESS)

		console.log("result is", result)
		const mul = 1000000000
		const rate = Number(result * BigInt(mul) / (100000000000n * (10n ** 12n))) / mul

		console.log("value is", rate)
	})

	it("should try and swap DAI->sDAI", async () => {
		const out = await testSwap(DAI_ADDRESS, 100000000000000000000000n, SDAI_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap sDAI->DAI", async () => {
		const out = await testSwap(SDAI_ADDRESS, 100000000000000000000000n, DAI_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap usdc->syrupUSDC", async () => {
		const out = await testSwap(USDC, 100000000000n, SYRUP_USDC)
		console.log("value is", out)
	})

	it("should try and swap usdc->syrupUSDT", async () => {
		const out = await testSwap(USDC, 100000000000n, SYRUP_USDT)
		console.log("value is", out)
	})

	it("should try and swap gho->syrupUSDT", async () => {
		const out = await testSwap(GHO, 100000000000000000000000n, SYRUP_USDT)
		console.log("value is", out)
	})

	it("should try and swap syrupUSDC -> usdc", async () => {
		const out = await testSwap(SYRUP_USDC, 100000000000n, USDC)
		console.log("value is", out)
	})

	it("should try and swap syrupUSDT -> usdc", async () => {
		const out = await testSwap(SYRUP_USDT, 100000000000n, USDC)
		console.log("value is", out)
	})

	it("should try and swap syrupUSDT -> gho", async () => {
		const out = await testSwap(SYRUP_USDT, 100000000000n, GHO)
		console.log("value is", out)
	})

	it("should try and swap wsrUSD -> USDT", async () => {
		const out = await testSwap(wsrUSD, 100000000000000000000n, USDT_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap USDC -> PT-thBILL on Arbitrum", async () => {
		const out = await testSwap(USDC_ARB, 100000000000n, PT_thBILL_19FEB2026, 42161)
		console.log("value is", out)
	})
})
