import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { AutomatedVault } from "../typechain-types"
import { deployStrategies } from "./utils"
import { getConfig } from "./config"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	const config = getConfig(hre.network.name)

	console.log("deploying contracts with the account:", deployer);
	const {
		uniswapStrategy,
		aaveStrategy,
		swapStrategy,
		balancesStrategy
	} = await deployStrategies(hre, config)

	const strategies = [uniswapStrategy.address, aaveStrategy.address, swapStrategy.address, balancesStrategy.address]
	console.log("deployed strategies:", strategies)

	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	const f = await hre.ethers.getContractFactory("AutomatedVault")
	if (deployment) {
		const contract: AutomatedVault = f.attach(deployment.address) as AutomatedVault
		console.log("deployment found. setting strategies", strategies)
		await contract.setStrategies(strategies)
	} else {
		console.log("deploying vault with strategies: ")
		const deployed = await deploy("AutomatedVault", {
			from: deployer,
			proxy: {
				execute: {
					init: {
						methodName: "__Vault_init",
						args: [strategies, [{ position: 0, callData: "0xe1c7392a" }, { position: 0, callData: "0xe1c7392a" }]],
					},
				},
			},
			log: true
		})

		console.log("initializing vault")
		const contract: AutomatedVault = f.attach(deployed.address) as AutomatedVault
		await contract.setOperator(deployer, true)
		await contract.rebalance(1, 500, [{ position: 0, callData: "0xe1c7392a" }, { position: 1, callData: "0xe1c7392a" }])
	}
}

export default func
func.tags = ['deploy-vault', 'deploy-eth-usdc-vault']
