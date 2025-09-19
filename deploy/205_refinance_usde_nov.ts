import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {MORPHO_BLUE, PT_USDe_NOV, USDC} from "../common/addresses"
import {verifyVaultAuthorized} from "../common/deposit-to-morpho"
import {ethers} from "hardhat"
import {MorphoBlue} from "../typechain-types"
import {getSignerAddress, getVaultAddress} from "./execute-strategy"
import {sendOrEstimate} from "./send-or-estimate"
import {refinance} from "../common/refinance"
import {Morpho} from "../common/lending/morpho"
import {Aave} from "../common/lending/aave"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const morphoBlue: MorphoBlue = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	const vault = await getVaultAddress(hre, "AaveVaultProxy")
	const from = await getSignerAddress()
	await verifyVaultAuthorized(from, morphoBlue, vault)

	const morpho = new Morpho("0x8cdb63a27a48ac27fadc0f158a732104bcc4e10bb61c9a5095ea7c127204e26c")
	const aave = new Aave(PT_USDe_NOV, USDC)
	await sendOrEstimate(hre, ex => refinance(ex, morpho, aave, 1), "AaveVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-USDe-NOV-25']


