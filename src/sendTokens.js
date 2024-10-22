const { ethers } = require("ethers");

// Сеть Polygon (mainnet RPC)
const polygonRpcUrl = "https://polygon-rpc.com"; // Или используйте другой RPC для сети Polygon

// Провайдер для подключения к сети
const provider = new ethers.JsonRpcProvider(polygonRpcUrl);

// Приватный ключ отправителя (замените на свой)
const privateKey = ''; // Замените на приватный ключ отправителя

// Создание кошелька с приватным ключом
const wallet = new ethers.Wallet(privateKey, provider);

// Адрес получателя (замените на адрес, куда хотите отправить токены)
const recipient = '0x2B4f140E6D1c4710D6377D94c720c9Bf4eed827D'; // Замените на адрес получателя

// Количество для отправки (в MATIC)
const amountToSend = '0.001'; // Задайте нужное количество для отправки

// Функция для отправки транзакции
async function sendTransaction() {
    // Проверяем баланс отправителя
    const senderBalance = await provider.getBalance(wallet.address);
    const formattedBalance = ethers.formatEther(senderBalance); // Преобразуем баланс в строку для вывода
    console.log(`Баланс отправителя: ${formattedBalance} MATIC`);

    // Проверяем, достаточно ли средств для отправки
    if (parseFloat(formattedBalance) < parseFloat(amountToSend)) {
        console.error("Недостаточно средств для отправки.");
        return;
    }

    // Получаем данные по газу (цена газа)
    const feeData = await provider.getFeeData();

    // Параметры транзакции
    const tx = {
        to: recipient, // Адрес получателя
        value: ethers.parseEther(amountToSend), // Количество MATIC в Wei
        gasPrice: feeData.gasPrice, // Цена газа
        gasLimit: 21000, // Стандартный лимит газа для простой транзакции
    };

    try {
        // Отправка транзакции
        const transaction = await wallet.sendTransaction(tx);
        console.log("Транзакция отправлена, хэш:", transaction.hash);

        // Ожидание подтверждения
        await transaction.wait();
        console.log("Транзакция подтверждена!");
    } catch (error) {
        console.error("Ошибка при отправке транзакции:", error);
    }
}

// Вызываем функцию отправки транзакции
sendTransaction();
