import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy";
import "hardhat-deploy-ethers"

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
		}
	},
	namedAccounts: {
		deployer: 0,
	},
}

export default config
