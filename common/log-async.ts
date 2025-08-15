export async function logAsync<T>(p: Promise<T>, message?: string) {
	try {
		return await p
	} catch (e) {
		if (message) {
			console.error(message, e)
		} else {
			console.error(e)
		}
	}
}