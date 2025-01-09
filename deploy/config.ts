export const CONFIG: Record<string, Config> = {
	arbitrum: {
		uniswapPool: "0x2f5e87C9312fa29aed5c179E456625D79015299c",
		nftManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
		token0: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", //wbtc
		token1: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", //weth
		aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
		longToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
		shortToken: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
	},
	arbitrum2: {
		uniswapPool: "0xC6962004f452bE9203591991D15f6b388e09E8D0",
		nftManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
		token0: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",//weth
		token1: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",//usdc
		aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
		longToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
		shortToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
	},
} as const

export type Config = {
	uniswapPool: string,
	nftManager: string,
	token0: string,
	token1: string,
	aavePool: string,
	longToken: string,
	shortToken: string
}

export function getConfig(networkName: string): Config {
	const config = CONFIG[networkName]
	if (!config) {
		throw new Error(`Network ${networkName} not found`)
	}
	return config
}
