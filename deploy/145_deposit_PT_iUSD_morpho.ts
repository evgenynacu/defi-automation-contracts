import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0x21b67f89513da0b0c94af8778134a1ba3f762f944f16208b42cc0663b07eaf05", 15000000000n, 8)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-iUSD-morpho']

//195528.947425 - 24000 * 7 * (1 + 0.1 * 41 / 365) - 24000 = 1641
//121543.728811834846670602 - 15000 * 7 * (1 + 0.065 * 40 / 365) - 15000 = 795 = 48%
