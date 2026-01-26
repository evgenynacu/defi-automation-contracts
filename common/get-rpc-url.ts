const RPC_URLS: Record<number, string> = {
	1: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
	42161: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
	9745: process.env.PLASMA_RPC_URL || "https://rpc.plasma.to"
}

export function getRpcUrl(chainId: number) {
	const rpcUrl = RPC_URLS[chainId]
	if (!rpcUrl) {
		throw new Error(`Not found RPC URL for chainId: ${chainId}`)
	}
	return rpcUrl
}