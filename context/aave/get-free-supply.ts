import { address } from "../../common/types"
import { AAVE_DATA_PROVIDER } from "../../common/addresses"
import { ERC20__factory, IPoolDataProvider__factory } from "../../typechain-types"
import { ContractRunner } from "ethers"

export async function getFreeSupply(runner: ContractRunner, token: address, aToken: address) {
	const dataProvider = IPoolDataProvider__factory.connect(AAVE_DATA_PROVIDER, runner)
	const erc20 = ERC20__factory.connect(token, runner)
	const [, supplyCap] = await dataProvider.getReserveCaps(token)
	const decimals = await erc20.decimals()
	const provided = await erc20.balanceOf(aToken)

	return Number(supplyCap - provided / (10n ** decimals))
}
