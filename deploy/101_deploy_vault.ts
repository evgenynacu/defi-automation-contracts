import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {ethers} from "hardhat"
import {deployStrategies} from "./deploy-strategies"
import {addressesEqual} from "./addresses-equal"
import {getConfig} from "./config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const {deploy} = hre.deployments;
	const {deployer} = await hre.getNamedAccounts();

	console.log("deploying contracts with the account:", deployer);

	const strategies = await deployStrategies(hre)

	console.log("Deploying vault or updating the code")
	const config = getConfig(hre.network.name)
	const vaultDeployResult = await deploy("AutomatedVault", {
		from: deployer,
		args: [config.morphoBlue, config.aavePoolAddressProvider],
		proxy: {
			proxyContract: "MyProxy",
			execute: {
				init: {
					methodName: "__Vault_init",
					args: [strategies],
				},
			},
		},
		log: true
	})

	const vault = await ethers.getContractAt("AutomatedVault", vaultDeployResult.address)
	const fetched = await vault.getStrategies()
	if (!addressesEqual(fetched, strategies)) {
		console.log("Updating list of strategies for the vault")
		await vault.setStrategies(strategies)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deploy-vault']
