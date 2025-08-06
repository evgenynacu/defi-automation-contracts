import { describe, it } from "mocha"
import { usdc, WETH_ADDRESS } from "../../addresses"
import { OdosV2Provider } from "./OdosV2Provider"

describe('provider', () => {
	it("should work with the provider", async () => {
		const p = new OdosV2Provider()
		const quote = await p.getQuote({
			fromToken: usdc,
			toToken: WETH_ADDRESS,
			chainId: 1,
			decimalsIn: 6,
			decimalsOut: 18,
			runner: null as any,
			swapAmount: 10000000000n,
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			txOrigin: WETH_ADDRESS,
		})
		console.log(quote)
	})
})