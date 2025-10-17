import {address} from "../common/types";
import {
	AAVE_POOL_ADDRESS_PROVIDER,
	AAVE_POOL_ADDRESS_PROVIDER_ARB, EVC, EVC_ARB,
	MORPHO_BLUE,
	MORPHO_BLUE_ARB
} from "../common/addresses";

export type Config = {
	morphoBlue: address,
	aavePoolAddressProvider: address,
	evc: address,
	merkl: address
}

const config: Record<string, Config> = {
	"arbitrum": {
		morphoBlue: MORPHO_BLUE_ARB,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER_ARB,
		evc: EVC_ARB,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae", //todo identify on arbitrum
	},
	"default": {
		morphoBlue: MORPHO_BLUE,
		aavePoolAddressProvider: AAVE_POOL_ADDRESS_PROVIDER,
		evc: EVC,
		merkl: "0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae",
	}
}

export function getConfig(network: string) {
	return config[network] || config["default"]
}