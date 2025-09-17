import {
	PT_eUSDe_AUG,
	PT_sUSDe_JUL,
	PT_sUSDe_SEP,
	PT_USDe_NOV,
	PT_USDe_SEP,
	usdc,
	USDT_ADDRESS
} from "../../common/addresses"
import { address, toAddress } from "../../common/types"

type AaveVault = {
	vault: address,
	collateral: address,
	debt: address,
	owner: address,
}

type EulerPositions = {
	collateralVault: address,
	debtVault: address,
	collateral: string,
	debt: string,
	owner: address,
}

export const eulerPositions: EulerPositions[] = [
	{
		collateralVault: "0xCfC6a55Aa72DCF3755A515aE8B82552028b63D2A",
		debtVault: "0x53AfE3343f322c4189Ab69E0D048efd154259419",
		collateral: "PT-pUSDe-16OCT2025",
		debt: "USDC",
		owner: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E"
	}
]

export const aaveVaults: AaveVault[] = [
	{
		vault: toAddress("0xE92096ecf53E4Ed58c8Dbc15af62249FaA76a7C8"),
		collateral: PT_eUSDe_AUG,
		debt: USDT_ADDRESS,
		owner: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42"
	},
	{
		vault: toAddress("0x7286fb0a79BEF605c5BF63B65Ce9607CBB26d502"),
		collateral: PT_sUSDe_SEP,
		debt: USDT_ADDRESS,
		owner: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E"
	},
	{
		vault: toAddress("0x7286fb0a79BEF605c5BF63B65Ce9607CBB26d502"),
		collateral: PT_sUSDe_SEP,
		debt: usdc,
		owner: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E"
	},
	{
		vault: toAddress("0x45BeD3404b87b30fEF2A6EE679aa50178072bAbb"),
		collateral: PT_USDe_SEP,
		debt: USDT_ADDRESS,
		owner: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42"
	},
	{
		vault: toAddress("0x45BeD3404b87b30fEF2A6EE679aa50178072bAbb"),
		collateral: PT_USDe_SEP,
		debt: usdc,
		owner: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42"
	},
	{
		vault: toAddress("0x45BeD3404b87b30fEF2A6EE679aa50178072bAbb"),
		collateral: PT_sUSDe_JUL,
		debt: USDT_ADDRESS,
		owner: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E"
	},
	{
		vault: toAddress("0x45BeD3404b87b30fEF2A6EE679aa50178072bAbb"),
		collateral: PT_sUSDe_JUL,
		debt: usdc,
		owner: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E"
	}
]

export const tokenMaturityDates: Record<string, Date> = {
	[PT_eUSDe_AUG]: new Date("2025-08-14"),
	[PT_sUSDe_SEP]: new Date("2025-09-25"),
	[PT_USDe_SEP]: new Date("2025-09-25"),
	[PT_sUSDe_JUL]: new Date("2025-07-31"),
	[PT_USDe_NOV]: new Date("2025-11-27"),
	["PT-pUSDe-16OCT2025"]: new Date("2025-10-16"),
}