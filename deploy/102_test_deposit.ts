import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { executeStrategy } from "./execute-strategy"
import { WETH_ADDRESS } from "./addresses"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	await executeStrategy(deployment.address, [{
		"@type": "morpho-flash-loan",
		token: WETH_ADDRESS,
		amount: 100000n,
		innerOperations: []
	}])
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['test-deposit']