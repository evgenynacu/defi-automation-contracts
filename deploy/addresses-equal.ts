export function addressesEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((val, index) => val.toLowerCase() === b[index].toLowerCase());
}
