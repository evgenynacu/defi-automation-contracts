export async function logAsync<T>(p: Promise<T>) {
	try {
		return await p
	} catch (e) {
		console.error(e)
	}
}