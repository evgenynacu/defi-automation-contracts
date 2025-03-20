import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await depositToMorpho(hre, "0xa59b6c3c6d1df322195bfb48ddcdcca1a4c0890540e8ee75815765096c1e8971", 990000000n, 7)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-USD0-curve']