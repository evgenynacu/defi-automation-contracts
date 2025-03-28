import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { AAVE_POOL_ADDRESS_PROVIDER, MORPHO_BLUE } from "./addresses"
import { ethers } from "hardhat"
import { deployStrategies } from "./deploy-strategies"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	console.log("deploying contracts with the account:", deployer);

	const strategies = await deployStrategies(hre)

	console.log("Deploying vault or updating the code")
	const vaultDeployResult = await deploy("AutomatedVault", {
		from: deployer,
		args: [MORPHO_BLUE, AAVE_POOL_ADDRESS_PROVIDER],
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

async function deployStrategy(hre: HardhatRuntimeEnvironment, strategyName: string, args: any[] = []) {
	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	return deploy(strategyName, {
		from: deployer,
		args,
		log: true,
	})
}

function addressesEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((val, index) => val.toLowerCase() === b[index].toLowerCase());
}


// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deploy-vault']
