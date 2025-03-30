import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { depositToAave } from "./deposit-to-aave"
import { sUSDe_ADDRESS, USDT_ADDRESS } from "./addresses"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await depositToAave(hre, 10003100011n, sUSDe_ADDRESS, USDT_ADDRESS, 9)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-aave-sUSDe']

