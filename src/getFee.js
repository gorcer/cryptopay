import EthService from './lib/EthService.js';

async function main() {
    const walletService = new EthService();
    const networkName = 'Polygon'; // Можно заменить на любую другую поддерживаемую сеть

    try {
        const feeData = await walletService.getFee(networkName);
        console.log(`Текущая комиссия в сети ${networkName}:`);
        console.log(`Gas Price: ${feeData.gasPrice}`);
        console.log(`Max Fee per Gas: ${feeData.maxFeePerGas}`);
        console.log(`Max Priority Fee per Gas: ${feeData.maxPriorityFeePerGas}`);
    } catch (error) {
        console.error("Ошибка при получении данных о комиссии:", error.message);
    }
}

main();
