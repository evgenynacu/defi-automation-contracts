import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {MORPHO_BLUE} from "../common/addresses"
import {verifyVaultAuthorized} from "../common/deposit-to-morpho"
import {ethers} from "hardhat"
import {MorphoBlue} from "../typechain-types"
import {getSignerAddress, getVaultAddress} from "./execute-strategy"
import {sendOrEstimate} from "./send-or-estimate"
import {refinance} from "../common/refinance"
import {Morpho} from "../common/lending/morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const vault = await getVaultAddress(hre)
	const from = await getSignerAddress()

	const morphoBlue: MorphoBlue = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	await verifyVaultAuthorized(from, morphoBlue, vault)
	const lendingFrom = new Morpho("0x32e253d33f1594a67fc6ef51bf7a39cc4bf2d14904998dee769706fcde489ed9")
	const lendingTo = new Morpho("0xa9f70093360419b4544f17a4553ac5847d896be23f020295bd95c24af4df700e")

	await sendOrEstimate(hre, ex => refinance(ex, lendingFrom, lendingTo, 0.1))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-wsrUSD-USDT-morpho']


