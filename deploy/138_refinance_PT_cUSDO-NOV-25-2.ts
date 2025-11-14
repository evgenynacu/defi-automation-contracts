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
	const lendingFrom = new Morpho("0x8a71a66ac828c2b6d4f8accce5859aba0822b502f3833bec4aff09479affffdb")
	const lendingTo = new Morpho("0x7fd694cd13880ce994c61e8f8991ce0c9e321e3d50f548dd62a1b6e610d29f32")

	await sendOrEstimate(hre, ex => refinance(ex, lendingFrom, lendingTo, 1))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-CUSDO-NOV-25-2']


