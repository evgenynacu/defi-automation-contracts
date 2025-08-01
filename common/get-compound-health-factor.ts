import { Contract, Provider } from "ethers";

const FACTOR_SCALE = 10n ** 18n; // 1e18

const cometAbi = [
	"function numAssets() view returns (uint8)",
	"function getAssetInfo(uint8) view returns (uint8,address,address,uint64,uint64,uint64,uint64,uint128)", // offset, asset, priceFeed, scale, borrowCF, liqCF, liquidationFactor, supplyCap
	"function getAssetInfoByAddress(address) view returns (uint8,address,address,uint64,uint64,uint64,uint64,uint128)",
	"function priceScale() view returns (uint64)",
	"function baseScale() view returns (uint64)",
	"function getPrice(address priceFeed) view returns (uint256)",
	"function collateralBalanceOf(address account, address asset) view returns (uint128)",
	"function borrowBalanceOf(address account) view returns (uint256)"
] as const;

type AssetInfoTuple = [bigint, string, string, bigint, bigint, bigint, bigint, bigint];
//                     offset, asset, priceFeed, scale, borrowCF, liqCF, liquidationFactor, supplyCap

/**
 * Рассчитывает Health Factor для пользователя в Comet.
 *
 * @param provider         ethers Provider
 * @param cometAddress     адрес Comet (рынка Compound III)
 * @param user             адрес пользователя
 * @param collateral (опц.) адрес залогового токена (поддерживается только, когда один залог)
 * @returns объект с HF (wad 1e18 и в виде числа), borrow, liquidationCapacity (в базовом активе)
 */
export async function getCompoundHealthFactor(
	provider: Provider,
	cometAddress: string,
	user: string,
	collateral: string
): Promise<{
	hfWad: bigint;           // HF * 1e18
	hf: number;              // HF как float (для отображения)
	borrow: bigint;          // долг в base-единицах (например, USDC, scale = baseScale)
	liquidationCapacity: bigint; // сумма залога*liqCF в base-единицах
}> {
	console.log("Getting compound health factor for user", user, "with collateral", collateral, "comet", cometAddress);
	const comet = new Contract(cometAddress, cometAbi, provider);

	const [priceScaleBN, baseScaleBN, info] = await Promise.all([
		comet.priceScale() as Promise<bigint>,
		comet.baseScale() as Promise<bigint>,
		comet.getAssetInfoByAddress(collateral) as Promise<AssetInfoTuple>
	]);
	const priceScale = priceScaleBN; // e.g. 1e8
	const baseScale  = baseScaleBN;  // e.g. 1e6 for USDC

	// Суммируем ликвидационную ёмкость (LiquidationCapacity) в base-единицах
	let liquidationCapacity: bigint = 0n;

	const [, asset, priceFeed, scaleBN, , liqCFBN] = info; // берем только нужные поля
	const scale = BigInt(scaleBN);     // 10**decimals(asset)
	const liqCF = BigInt(liqCFBN);     // 1e18

	const [bal, price, borrow] = await Promise.all([
		comet.collateralBalanceOf(user, asset) as Promise<bigint>,
		comet.getPrice(priceFeed) as Promise<bigint>,
		comet.borrowBalanceOf(user) as Promise<bigint>,
	])

	// Стоимость залога в базовом активе:
	// V_i = bal * price * baseScale / priceScale / scale
	const Vi = (bal * price * baseScale) / priceScale / scale;

	// Добавляем вклад с ликвидационным фактором
	// LiquidationCapacity += V_i * liqCF / 1e18
	liquidationCapacity += (Vi * liqCF) / FACTOR_SCALE;

	if (borrow === 0n) {
		return { hfWad: 2n ** 256n - 1n, hf: Number.POSITIVE_INFINITY, borrow, liquidationCapacity };
	}

	// HF = LiquidationCapacity / Borrow  (в wad 1e18 для удобства)
	const hfWad = (liquidationCapacity * FACTOR_SCALE) / borrow;
	const hf = Number(hfWad) / 1e18;

	return { hfWad, hf, borrow, liquidationCapacity };
}