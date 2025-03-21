import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await depositToMorpho(hre, "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e", 11596772959000000000000n, 20)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-rUSD']