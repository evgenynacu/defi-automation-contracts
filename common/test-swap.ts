import { createCalculateExecutor } from "./calculate-result"
import { address, AddressStateDiff } from "./types"
import { ethers } from "ethers"
import {
	DAI_ADDRESS,
	PT_sUSDe_SEP,
	rUSD,
	SDAI_ADDRESS,
	sUSDe_ADDRESS,
	SYRUP_USDC,
	usdc,
	USDe_ADDRESS, USDS,
	USDT_ADDRESS,
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
	const tokenStateDiff = getTokenStateDiff(fromToken)
	const ex = createCalculateExecutor(runner, "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240", "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E", {
		[fromToken]: {
			stateDiff: tokenStateDiff
		}
	})
	const from = await ex.getFrom()

	const r = await ex.execute([
		{
			type: "erc20-transfer-from",
			token: fromToken,
			amount: amount,
			from,
		},
		{
			type: "swap",
			from: fromToken,
			to: toToken,
			amount: amount,
			txOrigin: from,
		}
	])
	return r.result
}

export function getTokenStateDiff(token: address): AddressStateDiff {
	const tokenStateDiff: AddressStateDiff = {
		[getBalanceStorageSlot(token)]: "0x000000000000000000000000000ff00000000000000000006404586861f96590"
	}
	const allowanceSlot = getAllowanceStorageSlot(token)
	if (allowanceSlot) {
		tokenStateDiff[allowanceSlot] = "0x000000000000000000000000000ff00000000000000000006404586861f96590"
	}
	return tokenStateDiff
}

export function getBalanceStorageSlot(token: address): `0x${string}` {
	for (const entry of Object.entries(SLOTS)) {
		if (entry[0].toLowerCase() === token.toLowerCase()) {
			return entry[1]
		}
	}

	throw new Error("Unknown token for storage slot " + token)
}

function getAllowanceStorageSlot(token: address): `0x${string}` | undefined {
	for (const entry of Object.entries(ALLOWANCE_SLOTS)) {
		if (entry[0].toLowerCase() === token.toLowerCase()) {
			return entry[1]
		}
	}

	return undefined
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
	[USDT_ADDRESS]: "0x6011ef8ab201e2fab1f8a08cc98ee8ac9f35e18f8e1e90fb93e1a70ff037480d",
	[rUSD]: "0x04f57dd85ec5e81f7372eb95c7ed0161bd7e95fa724be8f8aeee3a93b24598cf",
	[PT_sUSDe_SEP]: "0xcbce38d2a396df10bbdba0503c72fc20ab34efc98f9cda900b01217a4dfee62d",
	[USDS]: "0x6011ef8ab201e2fab1f8a08cc98ee8ac9f35e18f8e1e90fb93e1a70ff037480d"
}

const ALLOWANCE_SLOTS: Record<address, `0x${string}`> = {
	[PT_sUSDe_SEP]: "0x0fafcce95fdb13f3372abd7f8bb2f110896a3f84a8c991c01ca7d7711c812472",
	[USDS]: "0x62fbb6bc62844b18e29b0c6750eb1e243f3dce9428157b74814e1fa1939abd5f",
}