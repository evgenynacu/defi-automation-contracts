import { ethers } from "hardhat"
import { CURVE_USD0_USD0PP, EZETH_ADDRESS, WETH_ADDRESS } from "../common/addresses"
import { address } from "../common/types"
import { expect } from "chai"
import { ProviderRegistry } from "../common/swap/providers/ProviderRegistry"
import { SwapResult } from "../common/swap/providers/types"
import { SwapProviderFacade } from "../common/swap/providers/SwapProviderFacade"
import { PendleProvider } from "../common/swap/providers/PendleProvider"

describe("SwapProvider", () => {
	it("should allow to sell PT", async () => {
		const p = new PendleProvider()
		const quote = await p.getQuote({
			runner: null as any,
			chainId: 1,
			fromToken: "0xb7de5dFCb74d25c2f21841fbd6230355C50d9308",
			toToken: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
			swapAmount: 10000000000000000000n,
			vault: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
			decimalsIn: 18,
			decimalsOut: 18,
			txOrigin: "0x0000000000000000000000000000000000000000",
		})
		expect(quote.to).to.be.eq("0x888888888889758F76e7103c6CbF23ABbF58F946")
	})

	it("should allow to buy curve LP", async () => {
		const [signer] = await ethers.getSigners()

		ProviderRegistry.initializeDefaultProviders()
		const instance = SwapProviderFacade.getInstance()
		const quotes = await instance.getAllQuotes({
			runner: null as any,
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
						runner: null as any,
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