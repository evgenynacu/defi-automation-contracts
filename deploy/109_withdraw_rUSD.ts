import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawFromMorpho } from "./withdraw-from-morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const [signer] = await ethers.getSigners()

	await withdrawFromMorpho(hre, signer, "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e", 1)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-rUSD']