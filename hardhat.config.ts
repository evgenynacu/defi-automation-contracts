import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import "hardhat-deploy-ethers"
import { config as dotenvConfig } from "dotenv"
import { resolve } from "path"
import { NetworksUserConfig } from "hardhat/types"

dotenvConfig({ path: resolve(__dirname, "./.env") });

const networks: NetworksUserConfig = {
	mainnet_universal: {
		url: "http://localhost:4000/rpc/code-123",
		chainId: 1,
		timeout: 60000,
	},
	hardhat: {
		allowBlocksWithSameTimestamp: true,
	}
}

if (process.env.ADMIN_PRIVATE_KEY) {
	networks.mainnet = {
		accounts: [process.env.ADMIN_PRIVATE_KEY!],
		url: "https://eth.llamarpc.com",
	}
}

const config: HardhatUserConfig = {
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
	solidity: {
		version: "0.8.24",
		settings: {
			viaIR: true
		}
	},
	networks,
	namedAccounts: {
		deployer: 0,
	},
}

export default config
