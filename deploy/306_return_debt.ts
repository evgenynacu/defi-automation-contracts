import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {PT_sUSDe_SEP, USDC, USDe_ADDRESS} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"
import {refinance} from "../common/refinance"
import {Aave} from "../common/lending/aave"
import {getSignerAddress, getVaultAddress} from "./execute-strategy";
import {MaxUint256} from "ethers";
import {verifyAllowance} from "../common/verify-allowance";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const [signer] = await hre.ethers.getSigners()
	const from = await getSignerAddress()
	const vault = await getVaultAddress(hre, "AaveUsdcVaultProxy")
	await verifyAllowance(signer, USDe_ADDRESS, 100000000000000000n, vault)
	await sendOrEstimate(hre, async ex => {
		return ex.execute([
			{
				type: "erc20-transfer-from",
				from: from,
				token: USDe_ADDRESS,
				amount: 100000000000000000n,
			},
			{
				type: "aave-repay",
				token: USDe_ADDRESS,
				amount: 100000000000000000n,
			},
			{
				type: "erc20-transfer-to",
				token: USDe_ADDRESS,
				to: from,
				amount: MaxUint256,
			}
		])
	}, "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['return-usde-debt']


//498201.850976938564093206 - 420000 * (1 + 0.05 * 78 / 365)
//106425.517180592135428526 - 15000 * 6 * (1 + 0.05 * 71 / 365)

//0x0000000000000000000000000000000000000000000000000000000000000036
//0x0000000000000000000000000000000000000000043b2dce4b4fb04127bbce3b

//0xc00262ed55c3f8b3ae06bbb28c20fbb0e54ee84605c5c00c4ce60d963f62f80b
//0x00000000043b2dce4b4fb04127bbce3b00000000000000000000000000000000

