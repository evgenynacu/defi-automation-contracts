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

	console.log("deploying contracts with the account:", deployer);
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
