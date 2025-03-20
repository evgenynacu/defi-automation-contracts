import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawEzETH } from "./withdraw-ezETH"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const [signer] = await ethers.getSigners()

	await withdrawEzETH(hre, signer, 1)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-ezETH']