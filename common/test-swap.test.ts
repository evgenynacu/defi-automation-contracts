import { testSwap } from "./test-swap"
import {
	DAI_ADDRESS,
	SDAI_ADDRESS,
	sUSDe_ADDRESS,
	USDe_ADDRESS,
	WEETH_ADDRESS,
	WETH_ADDRESS,
	WSTETH_ADDRESS
} from "./addresses"

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

	it("should try and swap sUSDe->USDe", async () => {
		const out = await testSwap(sUSDe_ADDRESS, 100000000000000000000000n, USDe_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap DAI->sDAI", async () => {
		const out = await testSwap(DAI_ADDRESS, 100000000000000000000000n, SDAI_ADDRESS)
		console.log("value is", out)
	})

	it("should try and swap sDAI->DAI", async () => {
		const out = await testSwap(SDAI_ADDRESS, 100000000000000000000000n, DAI_ADDRESS)
		console.log("value is", out)
	})
})
