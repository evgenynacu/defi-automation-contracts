import {address} from "../common/types"
import {
	DAI_ADDRESS, GHO,
	PT_eUSDe_AUG, PT_srUSDE_2APR2026, PT_sUSDe_9APR2026, PT_sUSDe_FEB26,
	PT_sUSDe_JUL,
	PT_sUSDe_SEP, PT_thBILL_19FEB2026,
	PT_USDe_NOV,
	PT_USDe_SEP, PYUSD,
	SDAI_ADDRESS,
	siUSD,
	stcUSD, sUSDD,
	sUSDe_ADDRESS, sUSDS, SYRUP_USDC, SYRUP_USDT,
	USDC,
	USDe_ADDRESS, USDe_PLASMA,
	USDS,
	USDT_ADDRESS,
	WEETH_ADDRESS,
	WETH_ADDRESS,
	wsrUSD,
	WSTETH_ADDRESS
} from "../common/addresses"

export const tokens: Record<address, string> = {
	[USDC]: "USDC",
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
	[PYUSD]: "PYUSD",
	[DAI_ADDRESS]: "DAI",
	[SDAI_ADDRESS]: "sDAI",
	[USDS]: "USDS",
	[siUSD]: "siUSD",
	"0xCcE7D12f683c6dAe700154f0BAdf779C0bA1F89A": "PT-syrupUSDC-AUG25",
	"0xB10DA2F9147f9cf2B8826877Cd0c95c18A0f42dc": "PT-cUSDO-20NOV2025",
	"0x61da65F0534C6A4F4c9757f2979A923c08d6D2aa": "PT-mMEV-30OCT2025",
	"0xb6ac3d5da138918ac4e84441e924a20daa60dbdd": "PT-sUSDe-27NOV2025",
	"0x4eaa571eafcd96f51728756bd7f396459bb9b869": "PT-USDe-27NOV2025",
	"0x1135b22d6e8fd0809392478eedcd8c107db6af9d": "PT-tUSDe-18DEC2025",
	"0xC3c7E5E277d31CD24a3Ac4cC9af3B6770F30eA33": "PT-stcUSD-29JAN2026",
	"0x1Fb3C5c35D95F48e48FFC8e36bCCe5CB5f29F57c": "PT-srUSDe-15JAN2026",
	"0xe4d30ccf87cb3e5e637b64a2ee21bd5d3901839a": "PT-mHYPER-20NOV2025",
	"0xb44cdBEF3145C1c1E772e8228E1154c80e70618e": "PT-iUSD-4DEC2025",
	"0x4956b52aE2fF65D74CA2d61207523288e4528f96": "RLP",
	"0xd2e230f71ca8db211067bc4070a94d268b313fa3": "PT-alUSD-11DEC2025",
	"0x545A490f9ab534AdF409A2E682bc4098f49952e3": "PT-cUSD-29JAN2026",
	[wsrUSD]: "wsrUSD",
	[stcUSD]: "stcUSD",
	[PT_sUSDe_FEB26]: "PT_sUSDe_FEB26",
	[PT_thBILL_19FEB2026]: "PT-thBILL-19FEB2026",
	[sUSDS]: "sUSDS",
	[SYRUP_USDT]: "syrupUSDT",
	[SYRUP_USDC]: "syrupUSDC",
	[GHO]: "GHO",
	[sUSDD]: "sUSDD",
	[PT_srUSDE_2APR2026]: "PT-srUSDE-2APR2026",
	[PT_sUSDe_9APR2026]: "PT-sUSDE-9APR2026",
	[USDe_PLASMA]: "USDe",
}

export function findToken(address: address): string | undefined {
	for (const [tokenAddress, tokenName] of Object.entries(tokens)) {
		if (tokenAddress.toLowerCase() === address.toLowerCase()) {
			return tokenName
		}
	}
	return undefined
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
	"0x1135b22d6e8fd0809392478eedcd8c107db6af9d": new Date("2025-12-18"),
	"0xC3c7E5E277d31CD24a3Ac4cC9af3B6770F30eA33": new Date("2026-01-29"),
	"0x1Fb3C5c35D95F48e48FFC8e36bCCe5CB5f29F57c": new Date("2026-01-15"),
	"0xe4d30ccf87cb3e5e637b64a2ee21bd5d3901839a": new Date("2025-11-20"),
	"0xb44cdBEF3145C1c1E772e8228E1154c80e70618e": new Date("2025-12-04"),
	"0xd2e230f71ca8db211067bc4070a94d268b313fa3": new Date("2025-12-11"),
	"0x545A490f9ab534AdF409A2E682bc4098f49952e3": new Date("2026-01-29"),
	[PT_sUSDe_FEB26]: new Date("2026-02-05"),
	[PT_srUSDE_2APR2026]: new Date("2026-04-02"),
	[PT_sUSDe_9APR2026]: new Date("2026-04-09"),
}