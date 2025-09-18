import { address } from "../common/types"
import {
	DAI_ADDRESS,
	PT_eUSDe_AUG, PT_sUSDe_JUL, PT_sUSDe_SEP, PT_USDe_NOV, PT_USDe_SEP, SDAI_ADDRESS, sUSDe_ADDRESS, usdc,
	USDe_ADDRESS, USDS,
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
	[PT_USDe_SEP]: "PT-USDe-SEP25",
	[PT_sUSDe_JUL]: "PT-sUSDe-JUL25",
	[PT_USDe_NOV]: "PT-USDe-NOV25",
	[WETH_ADDRESS]: "WETH",
	[WEETH_ADDRESS]: "weETH",
	[WSTETH_ADDRESS]: "wstETH",
	[USDe_ADDRESS]: "USDe",
	[sUSDe_ADDRESS]: "sUSDe",
	[DAI_ADDRESS]: "DAI",
	[SDAI_ADDRESS]: "sDAI",
	[USDS]: "USDS",
	"0xCcE7D12f683c6dAe700154f0BAdf779C0bA1F89A": "PT-syrupUSDC-AUG25",
	"0x80ac24aa929eaf5013f6436cda2a7ba190f5cc0b": "syrupUSDC",
	"0xB10DA2F9147f9cf2B8826877Cd0c95c18A0f42dc": "PT-cUSDO-20NOV2025",
	"0x61da65F0534C6A4F4c9757f2979A923c08d6D2aa": "PT-mMEV-30OCT2025",
}

export const tokenMaturityDates: Record<string, Date> = {
	[PT_eUSDe_AUG]: new Date("2025-08-14"),
	[PT_sUSDe_SEP]: new Date("2025-09-25"),
	[PT_USDe_SEP]: new Date("2025-09-25"),
	[PT_sUSDe_JUL]: new Date("2025-07-31"),
	[PT_USDe_NOV]: new Date("2025-11-27"),
	["PT-pUSDe-16OCT2025"]: new Date("2025-10-16"),
	"0xB10DA2F9147f9cf2B8826877Cd0c95c18A0f42dc": new Date("2025-11-20"),
	"0x61da65F0534C6A4F4c9757f2979A923c08d6D2aa": new Date("2025-10-30"),
}