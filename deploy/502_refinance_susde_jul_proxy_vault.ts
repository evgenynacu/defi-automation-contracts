import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MORPHO_BLUE, PT_sUSDe_JUL, USDT_ADDRESS } from "../common/addresses"
import { verifyVaultAuthorized } from "../common/deposit-to-morpho"
import { ethers } from "hardhat"
import { MorphoBlue } from "../typechain-types"
import { getSignerAddress, getVaultAddress } from "./execute-strategy"
import { sendOrEstimate } from "./send-or-estimate"
import { refinance } from "../common/refinance"
import { Morpho } from "../common/lending/morpho"
import { Aave } from "../common/lending/aave"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const morphoBlue: MorphoBlue = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	const vault = await getVaultAddress(hre, "AaveSusdeJulVaultProxy")
	const from = await getSignerAddress()
	await verifyVaultAuthorized(from, morphoBlue, vault)

	const morpho = new Morpho("0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef")
	const aave = new Aave(PT_sUSDe_JUL, USDT_ADDRESS)
	await sendOrEstimate(hre, ex => refinance(ex, morpho, aave, 1), "AaveSusdeJulVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-sUSDe-JUL-25']


//498201.850976938564093206 - 420000 * (1 + 0.05 * 78 / 365)
//106425.517180592135428526 - 15000 * 6 * (1 + 0.05 * 71 / 365)