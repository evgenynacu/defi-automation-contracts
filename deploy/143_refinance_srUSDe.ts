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
	const morpho = new Morpho("0x79b4e55cef9e7c214b5cc965e1984229ada26a66051e35366a75c4d92b776735")

	const collateralVault = "0x50E6bBa3847357e5ee2Cc55Cc2F5F5E69FdaBE36" as const
	const debtVault = "0x7c280DBDEf569e96c7919251bD2B0edF0734C5A8" as const

	const accountId = 8
	// const owner = xorSubAccountAddress(from, accountId)
	// const evc = await ethers.getContractAt("IEVC2", EVC)
	// await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)

	await sendOrEstimate(hre, ex => refinance(ex, morpho, euler, 1))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-srUSDe-JAN-26']


