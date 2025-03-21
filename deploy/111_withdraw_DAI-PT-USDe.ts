import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawFromMorpho } from "./withdraw-from-morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const [signer] = await ethers.getSigners()

	await withdrawFromMorpho(hre, signer, "0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905", 1)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-DAI-PT-USDe']