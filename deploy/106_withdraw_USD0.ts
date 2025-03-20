import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawFromMorpho } from "./withdraw-from-morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const [signer] = await ethers.getSigners()

	await withdrawFromMorpho(hre, signer, "0xddac4d5caa0b1923ef338d53e01876af69c5b68ebf8e268082c7d3e2be2e7f8e", 1)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-USD0-curve']