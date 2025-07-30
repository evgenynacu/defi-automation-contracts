import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MORPHO_BLUE, PT_sUSDe_JUL, PT_sUSDe_SEP, USDT_ADDRESS } from "../common/addresses"
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
	const vault = await getVaultAddress(hre, "AaveUsdcVaultProxy")
	const from = await getSignerAddress()
	await verifyVaultAuthorized(from, morphoBlue, vault)

	const morpho = new Morpho("0xc6ae8e71e11ef511acee3f6cc6ad2af67b862877d459e3789905f537c85db5e3")
	const aave = new Aave(PT_sUSDe_SEP, USDT_ADDRESS)
	await sendOrEstimate(hre, ex => refinance(ex, morpho, aave, 0.1), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-sUSDe-SEP-25']


//498201.850976938564093206 - 420000 * (1 + 0.05 * 78 / 365)
//106425.517180592135428526 - 15000 * 6 * (1 + 0.05 * 71 / 365)

//0x0000000000000000000000000000000000000000000000000000000000000036
//0x0000000000000000000000000000000000000000043b2dce4b4fb04127bbce3b

//0xc00262ed55c3f8b3ae06bbb28c20fbb0e54ee84605c5c00c4ce60d963f62f80b
//0x00000000043b2dce4b4fb04127bbce3b00000000000000000000000000000000

