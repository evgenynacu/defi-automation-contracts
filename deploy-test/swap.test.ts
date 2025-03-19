import { ethers } from "hardhat"
import { EZETH_ADDRESS, WETH_ADDRESS } from "../deploy/addresses"
import { address } from "../deploy/types"
import { expect } from "chai"
import { ProviderRegistry } from "../deploy/swap/providers/ProviderRegistry"
import { SwapResult } from "../deploy/swap/providers/types"

describe("SwapProvider", () => {
	it("all should fetch quote for simpe swap", async () => {
		const [signer] = await ethers.getSigners()

		const providers = ProviderRegistry.createAllProviders()
			.filter(p => p.getConfig().name !== "okx")
		const results = await Promise.all(providers.map(async provider => {
				try {
					let res = await provider.getQuote({
						chainId: 1,
						fromToken: WETH_ADDRESS,
						toToken: EZETH_ADDRESS,
						vault: signer.address as address,
						txOrigin: signer.address as address,
						swapAmount: 10n ** 18n,
						decimalsIn: 18,
						decimalsOut: 18
					})
					const result: ProviderResult = ({ ok: true, provider: provider.getConfig().name, result: res })
					return result
				} catch (err) {
					const result: ProviderResult = ({ ok: false, provider: provider.getConfig().name, error: err })
					return result
				}
			})
		)
		for (const result of results) {
			if (!result.ok) {
				expect(result.ok, `Provider ${result.provider} didn't work. err: ${result.error}`).to.be.true
			}
		}
	})
})

type ProviderResult = {
	ok: true
	provider: string
	result: SwapResult
} | {
	ok: false
	provider: string
	error: any
}