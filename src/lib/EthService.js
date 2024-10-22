import { ethers } from 'ethers';

class EthService {
    constructor() {
        this.networks = {
            // Ethereum: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
            Polygon: "https://polygon-rpc.com",
            ArbitrumOne: "https://arb1.arbitrum.io/rpc",
            AvalancheCChain: "https://api.avax.network/ext/bc/C/rpc",
            OKTChain: "https://exchainrpc.okex.org",
            Optimism: "https://mainnet.optimism.io",
            Tron: "https://api.trongrid.io",
            Solana: "https://api.mainnet-beta.solana.com",
            TON: "https://toncenter.com/api/v2/jsonRPC",
        };

        // Адрес контракта USDT на Polygon (замените для других сетей)
        this.usdtContractAddress = {
            Polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT контракт в Polygon
            // Для других сетей можно добавлять свои контракты
        };

        // ABI для взаимодействия с контрактом ERC-20
        this.erc20Abi = [
            "function transfer(address to, uint amount) public returns (bool)",
            "function balanceOf(address account) view returns (uint256)" // метод balanceOf
        ];
    }

    getProvider(networkName) {
        const rpcUrl = this.networks[networkName];

        if (!rpcUrl) {
            throw new Error(`Network "${networkName}" is not supported.`);
        }

        return new ethers.JsonRpcProvider(rpcUrl);
    }

    createWallet(networkName) {
        const provider = this.getProvider(networkName);
        const wallet = ethers.Wallet.createRandom();

        const walletWithProvider = wallet.connect(provider);

        return walletWithProvider;
    }


    async sendUsdt(networkName, senderPrivateKey, recipientAddress, amount = null) {
        const provider = this.getProvider(networkName);
        const usdtContractAddress = this.usdtContractAddress[networkName];

        if (!usdtContractAddress) {
            throw new Error(`USDT contract address not configured for network: ${networkName}`);
        }

        // Создаем кошелек отправителя
        const wallet = new ethers.Wallet(senderPrivateKey, provider);

        console.log(`Отправитель: ${wallet.address}`);

        // Создаем контракт USDT
        const usdtContract = new ethers.Contract(usdtContractAddress, this.erc20Abi, wallet);

        // Проверяем баланс отправителя USDT
        const senderUSDTBalance = await usdtContract.balanceOf(wallet.address);
        const formattedBalance = ethers.formatUnits(senderUSDTBalance, 6); // Преобразуем в USDT формат
        console.log(`Баланс отправителя USDT: ${formattedBalance} USDT`);

        // Если amount не указан, отправляем весь доступный баланс USDT
        let usdtToSend = amount ? ethers.parseUnits(amount, 6) : senderUSDTBalance;

        // Преобразуем в BigInt для правильной работы
        usdtToSend = BigInt(usdtToSend);
        const senderUSDTBalanceBigInt = BigInt(senderUSDTBalance);

        // Получаем данные о стоимости газа
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice; // В новой версии это BigInt
        const gasLimit = 60000n; // Граничное значение газа для токен-транзакций
        const gasCost = gasPrice * gasLimit; // Стоимость газа

        // Проверяем баланс MATIC (или другой нативной валюты) для оплаты газа
        const senderNativeBalance = await provider.getBalance(wallet.address);

        if (BigInt(senderNativeBalance) < gasCost) {
            throw new Error("Недостаточно средств для оплаты газа.");
        }

        // Проверяем, достаточно ли USDT для отправки
        if (usdtToSend == 0 || usdtToSend > senderUSDTBalanceBigInt) {
            throw new Error("Недостаточно USDT для отправки.");
        }

        try {
            // Отправляем USDT
            const tx = await usdtContract.transfer(recipientAddress, usdtToSend);
            console.log("Транзакция отправлена, хэш:", tx.hash);

            // Ожидание подтверждения
            await tx.wait();
            console.log("Транзакция подтверждена!");

            return tx;
        } catch (error) {
            console.error("Ошибка при отправке USDT:", error);
            throw error;
        }
    }


    async getFee(networkName) {
        const provider = this.getProvider(networkName);

        // Получаем данные о комиссиях
        const feeData = await provider.getFeeData();

        // Преобразуем данные в BigInt для дальнейших вычислений
        return {
            gasPrice: feeData.gasPrice, // Стоимость газа
            maxFeePerGas: feeData.maxFeePerGas || feeData.gasPrice, // Максимальная комиссия за газ
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 0n, // Максимальный приоритет
        };
    }
}

export default EthService;
