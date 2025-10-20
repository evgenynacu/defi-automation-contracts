import {address} from "../common/types";

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
	},
	{
		collateralVault: "0x0391d9029713B1E9Ee1e241CB53D6BC89bAf299d",
		debtVault: "0xe0a80d35bB6618CBA260120b279d357978c42BCE",
		collateral: "PT-tUSDe-18DEC2025",
		debt: "USDC",
		owner: "0x089fa9741628c1A4576F5BA47E02D1180b581e36"
	},
	{
		collateralVault: "0xad857E37bCdb3dD0712f5F3267D33ec1085F1a1d",
		debtVault: "0x8aFF4fe319c30475D27eC623D7d44bD5eCFe9616",
		collateral: "PT-mHYPER-20NOV2025",
		debt: "USDC",
		owner: "0x089fa9741628c1A4576F5BA47E02D1180b581e36"
	},
]
