import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MORPHO_BLUE, PT_sUSDe_JUL, PT_USDe_SEP, USDT_ADDRESS } from "../common/addresses"
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

	const morpho = new Morpho("0xb0a9ac81a8c6a5274aa1a8337aed35a2cb2cd4feb5c6d3b39d41f234fbf2955b")
	const aave = new Aave(PT_USDe_SEP, USDT_ADDRESS)
	await sendOrEstimate(hre, ex => refinance(ex, morpho, aave, 1), "AaveSusdeJulVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-USDe-SEP-25']


//498201.850976938564093206 - 420000 * (1 + 0.05 * 78 / 365)
//106425.517180592135428526 - 15000 * 6 * (1 + 0.05 * 71 / 365)

	//0x0000000000000000000000000000000000000000000000000000000000000036 = 0x0000000000000000000000000000000000000000014adf4b7320334b90000000