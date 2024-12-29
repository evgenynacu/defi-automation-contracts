import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	await deploy("SwapTest", {
		from: deployer,
		proxy: true,
		log: true
	})
}

export default func
func.tags = ['deploy-swap-test']
