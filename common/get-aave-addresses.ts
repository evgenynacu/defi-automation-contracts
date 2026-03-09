import { address, toAddress } from "./types"

const AAVE_POOL_RECORD: Record<number, address> = {
	1: toAddress("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"),
	42161: toAddress("0x794a61358D6845594F94dc1DB02A252b5b4814aD"),
	9745: toAddress("0x925a2A7214Ed92428B5b1B090F80b25700095e12"),
}

const AAVE_DATA_PROVIDER_RECORD: Record<number, address> = {
	1: toAddress("0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6"),
	42161: toAddress("0x243Aa95cAC2a25651eda86e80bEe66114413c43b"),
	9745: toAddress("0xf2D6E38B407e31E7E7e4a16E6769728b76c7419F"),
}

export function getAavePool(chainId: number | bigint): address {
	const id = typeof chainId === "bigint" ? Number(chainId) : chainId
	return AAVE_POOL_RECORD[id]
}

export function getAaveDataProvider(chainId: number | bigint): address {
	const id = typeof chainId === "bigint" ? Number(chainId) : chainId
	return AAVE_DATA_PROVIDER_RECORD[id]
}
