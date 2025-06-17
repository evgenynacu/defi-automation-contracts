import { testSwap } from "./test-swap"
import { WEETH_ADDRESS, WETH_ADDRESS, WSTETH_ADDRESS } from "./addresses"

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
})
