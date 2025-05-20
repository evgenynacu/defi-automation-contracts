import { Pool } from "pg"
import { openPositionSizeGauge } from "./metrics"

export async function exportLatestData(pool: Pool) {
	const res = await pool.query<DataResultRow>(
		`SELECT job_id, updated_at, data
     FROM data
     where updated_at > current_timestamp - interval '1 minute'`
	)
	res.rows.forEach(row => {
		const info = parseJobId(row.job_id)
		if (info !== undefined) {
			openPositionSizeGauge.set(
				{
					wallet: info.wallet,
					position_id: info.positionId
				},
				row.data.result
			)
		}
	})
}

function parseJobId(jobId: string): { wallet: string, positionId: string } | undefined {
	if (jobId.startsWith("morpho-withdraw")) {
		const parts = jobId.split("-")
		const wallet = parts[2]
		const positionId = parts[3]
		return {
			wallet: wallets[wallet] || wallet,
			positionId: marketIds[positionId] || positionId,
		}
	}
	return undefined
}

const wallets: Record<string, string> = {
	'0xEbca6F665A80466f410B3c2FD5a1696eDB664A42': "USD",
	'0x21F1359b6DD3392d3DC567d005d83B6d017CC60D': "BTC",
	'0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E': "ETH"
}

const marketIds: Record<string, string> = {
	"0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1": "PT-eUSDE-29MAY2025/DAI",
	"0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e": "srUSD/rUSD",
	"0xbfed072faee09b963949defcdb91094465c34c6c62d798b906274ef3563c9cac": "srUSD/USDC",
	"0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905": "PT-sUSDE-29MAY2025/DAI",
	"0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5": "sUSDS/USDT",
	"0x457b54a03c6bba984470d5687ec6df7967c0168bdc0052315713bfd287cd576c": "cUSDO/USDC",
	"0x10b401f4254a7039b7168c5a614c81ea8be698186cfb33aa56ac2adbcf0e88f9": "PT-RUSD-31JUL2025/USDC",
	"0x8b1bc4d682b04a16309a8adf77b35de0c42063a7944016cfc37a79ccac0007b6": "slvlUSD/USDC",
	"0x760b14c9003f08ac4bf0cfb02596ee4d6f0548a4fde5826bfd56befb9ed62ae9": "PT-USDe-31JUL2025/DAI",
	"0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef": "PT-sUSDe-31JUL2025/DAI",
	"0xbc552f0b14dd6f8e60b760a534ac1d8613d3539153b4d9675d697e048f2edc7e": "PT-sUSDe-31JUL2025/USDC",
	"0xeec6c7e2ddb7578f2a7d86fc11cf9da005df34452ad9b9189c51266216f5d71b": "PT-wstUSR-25SEP2025/USDC",
	"0x544b0a093b130a3fb01b72a1279ab848575f049c73da3b5c9c718f9350a1519c": "PT-csUSDL-31JUL2025/USDC",
}

type DataResultRow = {
	job_id: string
	updated_at: Date
	data: {
		result: number
	}
}