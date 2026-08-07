import {address} from "../common/types";
import {
	AAVE_POOL_ADDRESS_PROVIDER,
	AAVE_POOL_ADDRESS_PROVIDER_ARB, AAVE_POOL_ADDRESS_PROVIDER_PLASMA, EVC, EVC_ARB, EVC_PLASMA,
	MORPHO_BLUE,
	MORPHO_BLUE_ARB, UNISWAP_V4_POOL_MANAGER, UNISWAP_V4_POOL_MANAGER_ARB, ZERO_ADDRESS
} from "../common/addresses";

export type Config = {
	morphoBlue: address,
	aavePoolAddressProvider: address,
	evc: address,
	merkl: address
	ethenaS4Distributor: address,
	instaFlash: address,
	// Aave v4 is Ethereum-only for now; false elsewhere so the strategy slot stays zeroed.
	// There is no default spoke: the spoke is chosen per strategy, since each one is a separate risk market.
	aaveV4: boolean,
	// Uniswap v4 PoolManager, ZERO_ADDRESS where v4 is not deployed. Source of fee-free flash loans.
	uniswapV4PoolManager: address,
}

const config: Record<string, Config> = {
	"arbitrum": {
		morphoBlue: MORPHO_BLUE_ARB,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER_ARB,
		evc: EVC_ARB,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
		ethenaS4Distributor: ZERO_ADDRESS,
		instaFlash: ZERO_ADDRESS,
		aaveV4: false,
		uniswapV4PoolManager: UNISWAP_V4_POOL_MANAGER_ARB,
	},
	"arbitrum_universal": {
		morphoBlue: MORPHO_BLUE_ARB,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER_ARB,
		evc: EVC_ARB,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
		ethenaS4Distributor: ZERO_ADDRESS,
		instaFlash: ZERO_ADDRESS,
		aaveV4: false,
		uniswapV4PoolManager: UNISWAP_V4_POOL_MANAGER_ARB,
	},
	"plasma": {
		morphoBlue: ZERO_ADDRESS,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER_PLASMA,
		evc: EVC_PLASMA,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
		ethenaS4Distributor: ZERO_ADDRESS,
		instaFlash: "0x352423e2fA5D5c99343d371C9e3bC56C87723Cc7",
		aaveV4: false,
		uniswapV4PoolManager: ZERO_ADDRESS,
	},
	"default": {
		morphoBlue: MORPHO_BLUE,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER,
		evc: EVC,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
		ethenaS4Distributor: "0xc3b7d4ada2af58e6dc7b4fb303a0de47ade894c9",
		instaFlash: ZERO_ADDRESS,
		aaveV4: true,
		uniswapV4PoolManager: UNISWAP_V4_POOL_MANAGER,
	}
}

export function getConfig(network: string) {
	return config[network] || config["default"]
}