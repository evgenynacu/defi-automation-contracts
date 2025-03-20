import { ethers } from "hardhat"
import { CURVE_USD0_USD0PP, EZETH_ADDRESS, WETH_ADDRESS } from "../deploy/addresses"
import { address } from "../deploy/types"
import { expect } from "chai"
import { ProviderRegistry } from "../deploy/swap/providers/ProviderRegistry"
import { SwapResult } from "../deploy/swap/providers/types"
import { SwapProviderFacade } from "../deploy/swap/providers/SwapProviderFacade"

describe("SwapProvider", () => {
	it("should allow to buy curve LP", async () => {
		const [signer] = await ethers.getSigners()

		ProviderRegistry.initializeDefaultProviders()
		const instance = SwapProviderFacade.getInstance()
		const quotes = await instance.getAllQuotes({
			chainId: 1,
			fromToken: WETH_ADDRESS,
			toToken: CURVE_USD0_USD0PP,
			vault: signer.address as address,
			txOrigin: signer.address as address,
			swapAmount: 10n ** 18n,
			decimalsIn: 18,
			decimalsOut: 18
		})
		console.log(quotes.map(it => it.provider))
	})

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