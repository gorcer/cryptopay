import WalletService from './WalletService.js';

async function main() {
    const walletService = new WalletService();

    const networkName = 'Polygon';
    const senderPrivateKey = ''; // Замените на реальный приватный ключ
    const recipientAddress = '0xb73db07b9ead3dc38ef1ec08611fa21cf905a3fb'; // Замените на адрес получателя
    const amount = '0.0001'; // Количество USDT для отправки (6 знаков после запятой)

    try {
        await walletService.sendUsdt(networkName, senderPrivateKey, recipientAddress, amount);
        console.log("Отправка USDT завершена успешно.");
    } catch (error) {
        console.error("Ошибка при отправке USDT:", error.message);
    }
}

main();
