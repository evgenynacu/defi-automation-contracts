export function stringifyWithBigInt(obj: any, space?: number): string {
	return JSON.stringify(obj, (_key, value) => {
		return typeof value === 'bigint' ? value.toString() : value;
	}, space);
}
