import {address} from "./types";
import {MORPHO_BLUE, MORPHO_BLUE_ARB, ZERO_ADDRESS} from "./addresses";

const RECORD: Record<number, address> = {
	1: MORPHO_BLUE,
	42161: MORPHO_BLUE_ARB,
	9745: ZERO_ADDRESS,
}

export function getMorphoBlue(chainId: number | bigint): address {
	if (typeof chainId === "bigint") {
		return RECORD[Number(chainId)]
	}
	return RECORD[chainId]
}