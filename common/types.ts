export type address = `0x${string}`

export function toAddress(hex: string): address {
	if (hex.startsWith("0x")) {
		return hex as address
	}
  throw new Error("Invalid address " + hex)
}

export function toHex(possibly: string): `0x${string}` {
	if (possibly.startsWith("0x")) {
		return possibly as `0x${string}`
	}
	throw new Error("Invalid hex " + possibly)
}

export type StateDiff = Record<address, {
	stateDiff: AddressStateDiff,
}>

export type AddressStateDiff = Record<`0x${string}`, `0x${string}`>


