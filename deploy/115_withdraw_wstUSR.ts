import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawFromMorpho } from "./withdraw-from-morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const [signer] = await ethers.getSigners()

	await withdrawFromMorpho(hre, signer, "0xcfe8238ad5567886652ced15ee29a431c161a5904e5a6f380baaa1b4fdc8e302", 1)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-wstUSR']