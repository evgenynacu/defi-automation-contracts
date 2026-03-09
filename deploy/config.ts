import {address} from "../common/types";
import {
	AAVE_POOL_ADDRESS_PROVIDER,
	AAVE_POOL_ADDRESS_PROVIDER_ARB, AAVE_POOL_ADDRESS_PROVIDER_PLASMA, EVC, EVC_ARB, EVC_PLASMA,
	MORPHO_BLUE,
	MORPHO_BLUE_ARB, ZERO_ADDRESS
} from "../common/addresses";

export type Config = {
	morphoBlue: address,
	aavePoolAddressProvider: address,
	evc: address,
	merkl: address
	ethenaS4Distributor: address,
	instaFlash: address,
}

const config: Record<string, Config> = {
	"arbitrum": {
		morphoBlue: MORPHO_BLUE_ARB,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER_ARB,
		evc: EVC_ARB,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
		ethenaS4Distributor: ZERO_ADDRESS,
		instaFlash: ZERO_ADDRESS,
	},
	"arbitrum_universal": {
		morphoBlue: MORPHO_BLUE_ARB,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER_ARB,
		evc: EVC_ARB,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
		ethenaS4Distributor: ZERO_ADDRESS,
		instaFlash: ZERO_ADDRESS,
	},
	"plasma": {
		morphoBlue: ZERO_ADDRESS,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER_PLASMA,
		evc: EVC_PLASMA,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
		ethenaS4Distributor: ZERO_ADDRESS,
		instaFlash: "0x352423e2fA5D5c99343d371C9e3bC56C87723Cc7",
	},
	"default": {
		morphoBlue: MORPHO_BLUE,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER,
		evc: EVC,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
		ethenaS4Distributor: "0xc3b7d4ada2af58e6dc7b4fb303a0de47ade894c9",
		instaFlash: ZERO_ADDRESS,
	}
}

export function getConfig(network: string) {
	return config[network] || config["default"]
}