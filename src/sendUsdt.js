import EthService from './lib/EthService.js';

async function main() {
    const walletService = new EthService();

    const networkName = 'Polygon';
    const senderPrivateKey = '0xca02fd580b6f6eeb72384e3facd783143a80b309eacf59994f1d5976e2c5bca5'; // Замените на реальный приватный ключ
    const recipientAddress = '0xb73db07b9ead3dc38ef1ec08611fa21cf905a3fb'; // Замените на адрес получателя
    const amount = '0.0001'; // Количество USDT для отправки (6 знаков после запятой)

    try {
        await walletService.sendUsdt(networkName, senderPrivateKey, recipientAddress);
        console.log("Отправка USDT завершена успешно.");
    } catch (error) {
        console.error("Ошибка при отправке USDT:", error.message);
    }
}

main();
