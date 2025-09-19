import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { reservoirCreditEnforcer, reservoirPsm, reservoirSavingModule, rUSD, srUSD, USDC } from "../common/addresses"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const { deploy } = hre.deployments;
	const { deployer } = await hre.getNamedAccounts();

	console.log("deploying contracts with the account:", deployer);

	await deploy("ReservoirSwap", {
		from: deployer,
		args: [
			rUSD, USDC, srUSD, reservoirSavingModule, reservoirPsm, reservoirCreditEnforcer
		],
		log: true
	});
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deploy-reservoir-swap']
