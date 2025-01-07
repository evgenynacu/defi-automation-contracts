import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { AutomatedVault } from "../typechain-types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

	const dUniswap = await hre.deployments.get("UniswapStrategy")
	const dAave = await hre.deployments.get("AaveStrategy")
	const dSwap = await hre.deployments.get("SwapStrategy")
	const dBalances = await hre.deployments.get("BalancesStrategy")

	const deployment = await hre.deployments.get("AutomatedVault")

	const f = await hre.ethers.getContractFactory("AutomatedVault")
	const contract: AutomatedVault = f.attach(deployment.address) as AutomatedVault
	const strategies = [dUniswap.address, dAave.address, dSwap.address, dBalances.address]
	console.log("setting strategies", strategies)
	await contract.setStrategies(strategies)
}

export default func
func.tags = ['set-strategies-eth-usdc-vault']
