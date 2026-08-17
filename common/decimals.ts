export function getDecimals(token: string) {
	switch (token.toLowerCase()) {
		case "0xdAC17F958D2ee523a2206206994597C13D831ec7".toLowerCase(): //usdt
		case "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".toLowerCase(): //usdc
		case "0xCcE7D12f683c6dAe700154f0BAdf779C0bA1F89A".toLowerCase(): //PT-syrupUSDC-28AUG2025
		case "0xe343167631d89B6Ffc58B88d6b7fB0228795491D".toLowerCase(): //USDG
		case "0xc1906aeCf868749a2DeE203F59b904c0cf212140".toLowerCase(): //PT-USDG-24SEP2026
		case "0x87b65C4aAFFA76881f9E96F3e7ED945ddFC3Cd7A".toLowerCase(): //syrupUSDG
			return 6
	}
  return 18;
}