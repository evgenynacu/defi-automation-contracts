import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await depositToMorpho(hre, "0xddac4d5caa0b1923ef338d53e01876af69c5b68ebf8e268082c7d3e2be2e7f8e", 990000000n, 6.5)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-USD0-curve']