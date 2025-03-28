import { ethers } from "hardhat"

export async function getImplementationAddressFromProxy(proxyAddress: string) {
	const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

	const implementationData = await ethers.provider.getStorage(
		proxyAddress,
		implementationSlot
	);

	// Преобразуем данные в адрес (удаляем лишние нули в начале)
	return ethers.getAddress(
		"0x" + implementationData.slice(-40)
	);
}
