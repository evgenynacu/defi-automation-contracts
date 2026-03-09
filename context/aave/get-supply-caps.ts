import { address } from "../../common/types"
import { getAaveDataProvider } from "../../common/get-aave-addresses"
import { ERC20__factory, IPoolDataProvider__factory } from "../../typechain-types"
import { ContractRunner } from "ethers"

export type SupplyCaps = {
	cap: number
	provided: number
	available: number
}

export async function getSupplyCaps(runner: ContractRunner, token: address, aToken: address): Promise<SupplyCaps> {
	const { chainId } = await runner.provider!.getNetwork()
	const dataProvider = IPoolDataProvider__factory.connect(getAaveDataProvider(chainId), runner)
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
