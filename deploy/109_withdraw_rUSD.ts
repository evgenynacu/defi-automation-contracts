import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { estimateOutput } from "./estimate-output"
import { withdrawFromCompound } from "./withdraw-from-compound"
import { COMET_WETH_ADDRESS, EZETH_ADDRESS } from "./addresses"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => withdrawFromMorpho(hre, "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e", 1, true))
	} else {
		await withdrawFromMorpho(hre, "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e", 1, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-rUSD']