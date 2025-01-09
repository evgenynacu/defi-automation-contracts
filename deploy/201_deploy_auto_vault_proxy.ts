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

	console.log("Deploying proxy and using existing Vault impl")
	const impl = await hre.deployments.get("AutomatedVault_Implementation")

	const {
		uniswapStrategy,
		aaveStrategy,
		swapStrategy,
		balancesStrategy
	} = await deployStrategies(hre, config)

	const strategies = [uniswapStrategy.address, aaveStrategy.address, swapStrategy.address, balancesStrategy.address]
	console.log("deployed strategies:", strategies)

	console.log("Deploying proxy using impl", impl.address)
	const deployed = await deploy("EIP173Proxy", {
		from: deployer,
		args: [impl.address, deployer, "0x"],
		log: true,
	})

	const vaultFactory = await hre.ethers.getContractFactory("AutomatedVault")
	const vault = vaultFactory.attach(deployed.address) as AutomatedVault
	await vault.setStrategies(strategies)
	await vault.setOperator(deployer, true)
	await vault.rebalance(1, 500, [{ position: 0, callData: "0xe1c7392a" }, { position: 1, callData: "0xe1c7392a" }])
}

export default func
func.tags = ['deploy-vault', 'deploy-eth-usdc-vault-proxy']
