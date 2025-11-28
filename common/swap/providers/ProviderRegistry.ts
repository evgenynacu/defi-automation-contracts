import {ISwapProvider} from "./ISwapProvider"
import {OdosV2Provider} from "./OdosV2Provider"
import {KyberSwapProvider} from "./KyberSwapProvider"
import {PendleProvider} from "./PendleProvider"
import {ReservoirProvider} from "./ReservoirProvider"
import {EnsoApiProvider} from "./EnsoProvider";
import {InfinifiProvider} from "./InfinifiProvider";
import {ReservoirWsrUsdProvider} from "./ReservoirWsrUsdProvider";

export class ProviderRegistry {
	private static instance: ProviderRegistry
	private providers: Map<string, ISwapProvider> = new Map()

	private constructor() {
	}

	public static getInstance(): ProviderRegistry {
		if (!ProviderRegistry.instance) {
			ProviderRegistry.instance = new ProviderRegistry()
		}
		return ProviderRegistry.instance
	}

	public static initializeDefaultProviders(): void {
		const registry = ProviderRegistry.getInstance()

		for (const provider of this.createAllProviders()) {
			registry.registerProvider(provider)
		}
	}

	public static createAllProviders(): ISwapProvider[] {
		return [
			new InfinifiProvider(),
			new ReservoirWsrUsdProvider(),
			// new OneInchProvider(),
			new OdosV2Provider(),
			// new SushiSwapProvider(),
			new KyberSwapProvider(),
			// new EnsoProvider(),
			// new CowswapProvider(),
			// new KyberSwapIcarusProvider(),
			// new VeloraProvider(),
			// new UnizenProvider(),
			// new OkxProvider(),
			// new OpenoceanProvider(),
			// new UsorProvider(),
			// new ZeroexProvider(),
			// new StrataSwapProvider(),
			new EnsoApiProvider(),
			new PendleProvider(),
			new ReservoirProvider(),
		]
	}

	public registerProvider(provider: ISwapProvider): void {
		const config = provider.getConfig()
		this.providers.set(config.name, provider)
	}

	public getAllProviders(): ISwapProvider[] {
		return Array.from(this.providers.values())
	}

	public getEnabledProviders(): ISwapProvider[] {
		return this.getAllProviders().filter(p => p.getConfig().enabled)
	}
}