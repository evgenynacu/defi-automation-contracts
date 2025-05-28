import { address, toAddress } from "../common/types"
import { PT_eUSDe_AUG, USDT_ADDRESS } from "../common/addresses"

type AaveVault = {
	vault: address,
	collateral: address,
	debt: address,
	owner: address,
}

export const aaveVaults: AaveVault[] = [
	{
		vault: toAddress("0xE92096ecf53E4Ed58c8Dbc15af62249FaA76a7C8"),
		collateral: PT_eUSDe_AUG,
		debt: USDT_ADDRESS,
		owner: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42"
	}
]