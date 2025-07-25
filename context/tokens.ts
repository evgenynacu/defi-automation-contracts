import { address } from "../common/types"
import {
	DAI_ADDRESS,
	PT_eUSDe_AUG, PT_sUSDe_JUL, PT_sUSDe_SEP, SDAI_ADDRESS, sUSDe_ADDRESS, usdc,
	USDe_ADDRESS,
	USDT_ADDRESS,
	WEETH_ADDRESS,
	WETH_ADDRESS,
	WSTETH_ADDRESS
} from "../common/addresses"

export const tokens: Record<address, string> = {
	[usdc]: "USDC",
	[USDT_ADDRESS]: "USDT",
	[PT_eUSDe_AUG]: "PT-eUSDe-AUG25",
	[PT_sUSDe_SEP]: "PT-sUSDe-SEP25",
	[PT_sUSDe_JUL]: "PT-sUSDe-JUL25",
	[WETH_ADDRESS]: "WETH",
	[WEETH_ADDRESS]: "weETH",
	[WSTETH_ADDRESS]: "wstETH",
	[USDe_ADDRESS]: "USDe",
	[sUSDe_ADDRESS]: "sUSDe",
	[DAI_ADDRESS]: "DAI",
	[SDAI_ADDRESS]: "sDAI",
	"0xCcE7D12f683c6dAe700154f0BAdf779C0bA1F89A": "PT-syrupUSDC-AUG25",
	"0x80ac24aa929eaf5013f6436cda2a7ba190f5cc0b": "syrupUSDC",
}
