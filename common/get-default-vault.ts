import {address} from "./types";
import {ZERO_ADDRESS} from "./addresses";

const DEFAULT_VAULTS: Record<number, address> = {
	1: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
	42161: "0x85ca192a8AE32CaEB3bd14dbF0186B59023E2024",
	9745: ZERO_ADDRESS, //TODO
}

export function getDefaultVault(chainId: number) {
	const vault = DEFAULT_VAULTS[chainId]
	if (!vault) {
		throw new Error("Unable to get default vault for chainId " + chainId)
	}
	return vault
}