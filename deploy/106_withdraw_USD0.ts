import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawFromMorpho } from "./withdraw-from-morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const [signer] = await ethers.getSigners()

	await withdrawFromMorpho(hre, signer, "0xa59b6c3c6d1df322195bfb48ddcdcca1a4c0890540e8ee75815765096c1e8971", 1)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-USD0-curve']