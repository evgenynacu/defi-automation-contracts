import { address } from "../common/types"
import { PT_eUSDe_AUG, USDT_ADDRESS, WEETH_ADDRESS, WETH_ADDRESS, WSTETH_ADDRESS } from "../common/addresses"

export const tokens: Record<address, string> = {
	[USDT_ADDRESS]: "USDT",
	[PT_eUSDe_AUG]: "PT-eUSDe-AUG25",
	[WETH_ADDRESS]: "WETH",
	[WEETH_ADDRESS]: "weETH",
	[WSTETH_ADDRESS]: "wstETH",
}
