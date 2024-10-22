import EthService from './lib/EthService.js';

async function main() {
    const walletService = new EthService();

    // Например, создаем кошелек для сети Polygon
    const networkName = 'TON';
    try {
        const walletWithProvider = walletService.createWallet(networkName);
        console.log("Адрес кошелька:", walletWithProvider.address);
        console.log("Приватный ключ (храните в секрете!):", walletWithProvider.privateKey);

        console.log(`Кошелек для сети ${networkName} готов к использованию.`);
    } catch (error) {
        console.error("Ошибка:", error.message);
    }
}

main();
