import { type ContractRunner } from "ethers"
import { address } from "./types"
import { AutomatedVault__factory } from "../typechain-types"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

/**
 * Checks that an address really is one of our vaults before it is granted anything.
 *
 * Every other script tolerates a wrong VAULT because the transaction just reverts. Approvals are the
 * exception: granting to the wrong address succeeds, is permanent, and hands over unlimited authority
 * to move the signer's funds. `getVaultAddress` reads VAULT straight from the environment and casts it,
 * which is a type assertion and not a check — so this is the only thing standing between a typo and a
 * total loss.
 *
 * @param requiredStrategyIndex slot the caller intends to use; a vault without it cannot act on the
 *                              approvals at all, which almost always means the wrong address.
 */
export async function verifyVault(
	runner: ContractRunner,
	vault: address,
	requiredStrategyIndex?: number,
): Promise<string[]> {
	const code = await runner.provider!.getCode(vault)
	if (code === "0x") {
		throw new Error(`Refusing to approve ${vault}: no contract there (an EOA or a wrong address)`)
	}

	let strategies: string[]
	try {
		strategies = [...await AutomatedVault__factory.connect(vault, runner).getStrategies()]
	} catch {
		throw new Error(`Refusing to approve ${vault}: not an AutomatedVault (getStrategies() failed)`)
	}

	if (requiredStrategyIndex !== undefined) {
		const strategy = strategies[requiredStrategyIndex]
		if (!strategy || strategy === ZERO_ADDRESS) {
			throw new Error(
				`Refusing to approve ${vault}: strategy slot ${requiredStrategyIndex} is empty ` +
				`(${strategies.length} strategies). This vault cannot use the approvals — redeploy it, ` +
				`or check that VAULT points at the vault you meant.`
			)
		}
	}

	return strategies
}
