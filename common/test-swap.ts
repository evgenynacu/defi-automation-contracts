import { createCalculateExecutor } from "./calculate-result"
import { address } from "./types"
import { ethers } from "ethers"
import { WEETH_ADDRESS, WETH_ADDRESS, WSTETH_ADDRESS } from "./addresses"

export async function testSwap(
	fromToken: address,
	amount: bigint,
	toToken: address,
) {
	const runner = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
	const ex = createCalculateExecutor(runner, "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240", "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E", {
		[fromToken]: {
			stateDiff: {
				[getSlot(fromToken)]: "0x000000000000000000000000000ff00000000000000000006404586861f96590"
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

function getSlot(token: address): `0x${string}` {
	if (token === WEETH_ADDRESS) {
		return "0x59a5b920ef65d9f4fbe8bc12b1741664384f86b122ff193ed6f81dd7fdf24f99"
	}
	if (token === WSTETH_ADDRESS) {
		return "0xcbce38d2a396df10bbdba0503c72fc20ab34efc98f9cda900b01217a4dfee62d"
	}
	if (token === WETH_ADDRESS) {
		return "0xfd5f8c061cfecd096dabc8fd13b51ab68a4f601f87b140bce0bc3e7d5838b3a7"
	}
	throw new Error("Unknown token " + token)
}