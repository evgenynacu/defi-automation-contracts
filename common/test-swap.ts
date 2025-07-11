import { createCalculateExecutor } from "./calculate-result"
import { address } from "./types"
import { ethers } from "ethers"
import {
	DAI_ADDRESS,
	SDAI_ADDRESS,
	sUSDe_ADDRESS, SYRUP_USDC, usdc,
	USDe_ADDRESS, USDT_ADDRESS,
	WEETH_ADDRESS,
	WETH_ADDRESS,
	WSTETH_ADDRESS
} from "./addresses"

export async function testSwap(
	fromToken: address,
	amount: bigint,
	toToken: address,
) {
	const runner = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
	const ex = createCalculateExecutor(runner, "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240", "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E", {
		[fromToken]: {
			stateDiff: {
				[getBalanceStorageSlot(fromToken)]: "0x000000000000000000000000000ff00000000000000000006404586861f96590"
			}
		}
	})

	const r = await ex.execute([
		{
			type: "erc20-transfer-from-caller",
			token: fromToken,
			amount: amount,
		},
		{
			type: "swap",
			from: fromToken,
			to: toToken,
			amount: amount,
		}
	])
	return r.result
}

export function getBalanceStorageSlot(token: address): `0x${string}` {
	for (const entry of Object.entries(SLOTS)) {
		if (entry[0].toLowerCase() === token.toLowerCase()) {
			return entry[1]
		}
	}

	throw new Error("Unknown token " + token)
}

const SLOTS: Record<address, `0x${string}`> = {
	[WEETH_ADDRESS]: "0x59a5b920ef65d9f4fbe8bc12b1741664384f86b122ff193ed6f81dd7fdf24f99",
	[WSTETH_ADDRESS]: "0xcbce38d2a396df10bbdba0503c72fc20ab34efc98f9cda900b01217a4dfee62d",
	[WETH_ADDRESS]: "0xfd5f8c061cfecd096dabc8fd13b51ab68a4f601f87b140bce0bc3e7d5838b3a7",
	[USDe_ADDRESS]: "0x6011ef8ab201e2fab1f8a08cc98ee8ac9f35e18f8e1e90fb93e1a70ff037480d",
	[sUSDe_ADDRESS]: "0xaff56123b65031ca3d303f0163b592a442d812a900318bc3c9f5726b6fa0e68c",
	[SDAI_ADDRESS]: "0x04f57dd85ec5e81f7372eb95c7ed0161bd7e95fa724be8f8aeee3a93b24598cf",
	[DAI_ADDRESS]: "0x6011ef8ab201e2fab1f8a08cc98ee8ac9f35e18f8e1e90fb93e1a70ff037480d",
	[SYRUP_USDC]: "0xfd5f8c061cfecd096dabc8fd13b51ab68a4f601f87b140bce0bc3e7d5838b3a7",
	[usdc]: "0x6e2324c72188c90dab855a9ae77483acaec3da153b2cdf4069dcba2ea4716549",
	[USDT_ADDRESS]: "0xc0b87546156c6bc4afdafbd99339c8c32ca633af55f0eb785a159c54f99b0840",
}