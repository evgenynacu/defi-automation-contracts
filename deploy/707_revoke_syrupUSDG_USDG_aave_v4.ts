import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { getVaultAddress } from "./execute-strategy"
import { revokeAaveV4OnBehalf } from "../common/revoke-aave-v4-on-behalf"
import { SYRUP_USDG_USDG } from "../common/aave-v4/positions"

/**
 * Withdraws the authority granted by 704, once the position is closed.
 *
 * Without this the vault keeps unlimited withdraw and borrow rights over the owner's position for good,
 * long after the position is gone. Refuses to run while collateral or debt is still outstanding, since
 * revoking mid-position leaves the scripted exit unable to work.
 *
 * REVOKE_POSITION_MANAGERS=1 also drops the spoke-level manager approvals. Those are shared by every
 * vault the owner uses on this spoke, so only do it when retiring the spoke entirely.
 */
const { spoke: SPOKE, collateral: COLLATERAL, debt: DEBT } = SYRUP_USDG_USDG

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const [signer] = await hre.ethers.getSigners()
	const vault = await getVaultAddress(hre)

	await revokeAaveV4OnBehalf(signer, vault, SPOKE, [COLLATERAL], [DEBT], {
		positionManagers: process.env.REVOKE_POSITION_MANAGERS === "1",
	})
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['revoke-syrupUSDG-USDG-aave-v4']
