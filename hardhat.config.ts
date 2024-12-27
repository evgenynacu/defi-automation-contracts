import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import "hardhat-deploy-ethers"
import { config as dotenvConfig } from "dotenv"
import { resolve } from "path"

dotenvConfig({ path: resolve(__dirname, "./.env") });

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.24",
		settings: {
			viaIR: true
		}
	},
	networks: {
		hardhat: {
			allowBlocksWithSameTimestamp: true,
		},
		scroll: {
			url: "http://127.0.0.1:1248",
			chainId: 534352,
			timeout: 60000,
		},
		arbitrum: {
			accounts: [process.env.ADMIN_PRIVATE_KEY!],
			url: "https://1rpc.io/arb",
		},
	},
	namedAccounts: {
		deployer: 0,
	},
}

export default config
