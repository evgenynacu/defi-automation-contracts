import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {EVC, MORPHO_BLUE, PT_USDe_NOV, USDC} from "../common/addresses"
import {verifyVaultAuthorized} from "../common/deposit-to-morpho"
import {ethers} from "hardhat"
import {MorphoBlue} from "../typechain-types"
import {getSignerAddress, getVaultAddress} from "./execute-strategy"
import {sendOrEstimate} from "./send-or-estimate"
import {refinance} from "../common/refinance"
import {Morpho} from "../common/lending/morpho"
import {Aave} from "../common/lending/aave"
import {Euler, xorSubAccountAddress} from "../common/lending/euler";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const vault = await getVaultAddress(hre)
	const from = await getSignerAddress()

	const morphoBlue: MorphoBlue = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	await verifyVaultAuthorized(from, morphoBlue, vault)
	const morpho = new Morpho("0x7fd694cd13880ce994c61e8f8991ce0c9e321e3d50f548dd62a1b6e610d29f32")

	const collateralVault = "0xaabc07A47D2a63a9b06A7924a0780c2F3cAE7bf9" as const
	const debtVault = "0x7c280DBDEf569e96c7919251bD2B0edF0734C5A8" as const

	const accountId = 9
	// const owner = xorSubAccountAddress(from, accountId)
	// const evc = await ethers.getContractAt("IEVC2", EVC)
	// await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)

	await sendOrEstimate(hre, ex => refinance(ex, euler, morpho, 1))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-CUSDO-NOV-25-3']


