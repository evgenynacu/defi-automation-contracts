import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"

const config: HardhatUserConfig = {
	solidity: "0.8.24",
	networks: {
		hardhat: {
			allowBlocksWithSameTimestamp: true,
		},
		scroll: {
			url: "http://127.0.0.1:1248",
			chainId: 534352,
			timeout: 60000,
		}
	},
	namedAccounts: {
		deployer: 0,
	},
}

export default config
