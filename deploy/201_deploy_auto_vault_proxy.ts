import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { AutomatedVault } from "../typechain-types"

const ethUsdcPool = "0xC6962004f452bE9203591991D15f6b388e09E8D0"
const nftManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const usdc = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
const weth = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const aavePool = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	console.log("Deploying proxy and using existing Vault impl")
	const impl = await hre.deployments.get("AutomatedVault_Implementation")

	const uniswapStrategy = await deploy("UniswapStrategy", {
		from: deployer,
		args: [ethUsdcPool, nftManager],
		log: true
	})

	const aaveStrategy = await deploy("AaveStrategy", {
		from: deployer,
		args: [aavePool, usdc, weth],
		log: true
	})

	const swapStrategy = await deploy("SwapStrategy", {
		from: deployer,
		args: [ethUsdcPool, 1],
		log: true
	})

	const balancesStrategy = await deploy("BalancesStrategy", {
		from: deployer,
		args: [weth, usdc],
		log: true
	})

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
