import {address} from "./types";
import {MORPHO_BLUE, MORPHO_BLUE_ARB} from "./addresses";

const RECORD: Record<number, address> = {
	1: MORPHO_BLUE,
	42161: MORPHO_BLUE_ARB,
}

export function getMorphoBlue(chainId: number | bigint): address {
	if (typeof chainId === "bigint") {
		return RECORD[Number(chainId)]
	}
	return RECORD[chainId]
}