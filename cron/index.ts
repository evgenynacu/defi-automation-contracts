async function runJobs() {
	console.log("Starting cron jobs")

	const cron = await import("node-cron")
	cron.schedule('*/5 * * * *', () => {
		console.log("Running cron job")
	});

	console.log("Initialized cron jobs")
}

runJobs().then()
