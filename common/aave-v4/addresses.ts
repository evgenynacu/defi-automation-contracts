import { toAddress } from "../types"

// Aave v4 (hub & spoke) deployments. Ethereum only for now — v4 is not deployed on arbitrum or plasma,
// those chains stay on v3. Mirrors @bgd-labs/aave-address-book AaveV4Ethereum.

// Hubs hold the liquidity. Each spoke draws from one or more of them against a per-asset credit line.
export const AAVE_V4_HUBS = {
	CORE: toAddress("0xCca852Bc40e560adC3b1Cc58CA5b55638ce826c9"),
	PLUS: toAddress("0x06002e9c4412CB7814a791eA3666D905871E536A"),
	PRIME: toAddress("0x943827DCA022D0F354a8a8c332dA1e5Eb9f9F931"),
	GLOBAL_DOLLAR: toAddress("0x62d63197660c080236193CA60b70E49A08E90368"),
} as const

// Spokes are the risk layer ("markets" in the Aave Pro UI). Each lists its own reserves.
export const AAVE_V4_SPOKES = {
	MAIN: toAddress("0x94e7A5dCbE816e498b89aB752661904E2F56c485"),
	BLUECHIP: toAddress("0x973a023A77420ba610f06b3858aD991Df6d85A08"),
	ETHENA_CORRELATED: toAddress("0x58131E79531caB1d52301228d1f7b842F26B9649"),
	ETHENA_ECOSYSTEM: toAddress("0xba1B3D55D249692b669A164024A838309B7508AF"),
	FOREX: toAddress("0xD8B93635b8C6d0fF98CbE90b5988E3F2d1Cd9da1"),
	GOLD: toAddress("0x65407b940966954b23dfA3caA5C0702bB42984DC"),
	LOMBARD_BTC: toAddress("0x7EC68b5695e803e98a21a9A05d744F28b0a7753D"),
	USDG_PENDLE: toAddress("0x956d8e0A89cfa3744428C4641b5a53B56167a7f9"),
	USDG_MAPLE: toAddress("0x774b9655413c34809c1f1b16b654465A89EBE989"),
	ETHERFI: toAddress("0xbF10BDfE177dE0336aFD7fcCF80A904E15386219"),
	KELP: toAddress("0x3131FE68C4722e726fe6B2819ED68e514395B9a4"),
	LIDO: toAddress("0xe1900480ac69f0B296841Cd01cC37546d92F35Cd"),
	TREASURY: toAddress("0xB9B0b8616f6Bf6841972a52058132BE08d723155"),
} as const

/** Reverse lookup for labelling — falls back to the address for an unlisted hub. */
export function getHubName(hub: string): string {
	const entry = Object.entries(AAVE_V4_HUBS).find(([, a]) => a.toLowerCase() === hub.toLowerCase())
	return entry ? entry[0] : hub
}

/** Reverse lookup for labelling — falls back to the address for an unlisted spoke. */
export function getSpokeName(spoke: string): string {
	const entry = Object.entries(AAVE_V4_SPOKES).find(([, a]) => a.toLowerCase() === spoke.toLowerCase())
	return entry ? entry[0] : spoke
}

// Governance-deployed position managers, active on every spoke. These are what let a vault operate a
// position it does not own — the spoke rejects a foreign onBehalfOf from anyone else.
export const AAVE_V4_POSITION_MANAGERS = {
	GIVER: toAddress("0x17A54b8d6D9C68e7fa1C7112AC998EA1BA51d11e"),
	TAKER: toAddress("0x6c044c0D3801499bCAbfAd458B70880bc518e9F7"),
	CONFIG: toAddress("0x51305839CE822a7b4b12AA7D86eA7005052d575c"),
} as const
