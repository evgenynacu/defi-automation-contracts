import { address } from "../../common/types"
import { AAVE_DATA_PROVIDER } from "../../common/addresses"
import { ERC20__factory, IPoolDataProvider__factory } from "../../typechain-types"
import { ContractRunner } from "ethers"

export type SupplyCaps = {
	cap: number
	provided: number
	available: number
}

export async function getSupplyCaps(runner: ContractRunner, token: address, aToken: address): Promise<SupplyCaps> {
	const dataProvider = IPoolDataProvider__factory.connect(AAVE_DATA_PROVIDER, runner)
	const erc20 = ERC20__factory.connect(token, runner)
	const [, supplyCap] = await dataProvider.getReserveCaps(token)
	const decimals = await erc20.decimals()
	const provided = await erc20.balanceOf(aToken)

	return {
		available: Number(supplyCap - provided / (10n ** decimals)),
		cap: Number(supplyCap),
		provided: Number(provided / (10n ** decimals)),
	}
}
