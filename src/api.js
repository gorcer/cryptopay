import express from 'express';
import { AppDataSource } from './dataSource.js';
import { Wallet } from './entity/Wallet.js';
import { Invoice } from './entity/Invoice.js';
import cron from 'node-cron';
import axios from 'axios';
import { ethers } from 'ethers';
import fs from 'fs';
import EthService from './lib/EthService.js';
import { WalletRepository } from './repository/WalletRepository.js';

const ethService = new EthService();
const walletRepository = new WalletRepository(AppDataSource);

const app = express();
app.use(express.json());

// Загружаем конфиг проектов
const projectConfig = JSON.parse(fs.readFileSync('./projects.conf.json', 'utf-8'));

// Подключаем базу данных
AppDataSource.initialize().then(() => {
    console.log('Data Source has been initialized!');
}).catch((err) => {
    console.error('Error during Data Source initialization', err);
});

// getWallet(network, project, user_id)

app.post('/getWallet', async (req, res) => {
    const { network, project, user_id } = req.body;

    // Проверяем, есть ли проект в конфиге
    const projectData = projectConfig.projects[project];
    if (!projectData) {
        return res.status(400).json({ error: "Invalid project" });
    }

    try {
        // Проверяем, существует ли уже кошелек с такими параметрами в базе данных через WalletRepository
        const existingWallet = await walletRepository.findWalletByDetails(network, project, user_id);

        if (existingWallet) {
            // Если кошелек уже существует, возвращаем его
            return res.json({ wallet_address: existingWallet.wallet_address });
        }

        // Если кошелек не существует, создаем новый с использованием WalletService
        const wallet = ethService.createWallet(network);

        // Сохраняем кошелек в базе данных через WalletRepository
        await walletRepository.createWalletRecord(network, project, user_id, wallet.address, wallet.privateKey);

        // Возвращаем адрес кошелька
        res.json({ wallet_address: wallet.address });
    } catch (error) {
        console.error('Error creating wallet:', error);
        res.status(500).json({ error: 'Failed to create wallet' });
    }
});

// create invoice(walletAddress, key, project, network, amount=0)
app.post('/createInvoice', async (req, res) => {
    const { walletAddress, key, project, network, amount = 0 } = req.body;

    // Получаем информацию о проекте из конфига
    const projectData = projectConfig.projects[project];
    if (!projectData) {
        return res.status(400).json({ error: "Invalid project" });
    }

    const invoice = AppDataSource.manager.create(Invoice, {
        wallet_address: walletAddress,
        project,
        network,
        amount,
        status: "pending",
    });
    await AppDataSource.manager.save(invoice);
    res.json({ invoice });
});

app.post('/checkIncome', async (req, res) => {
    const { walletAddress, project } = req.body;

    // Получаем информацию о проекте
    const projectData = projectConfig.projects[project];
    if (!projectData) {
        return res.status(400).json({ error: 'Invalid project' });
    }

    const invoice = await AppDataSource.manager.findOne(Invoice, {
        where: { wallet_address: walletAddress },
    });


    try {
        // Проверяем баланс и переводим средства с помощью WalletService
        const result = await ethService.checkAndTransferBalance(invoice, projectData.address);

        if (result.success) {
            // Уведомляем проект об успешной транзакции
            await axios.post(projectData.success_url, {
                status: 'success',
                invoice,
                txHash: result.txHash,
                amount: ethers.formatUnits(result.amountTransferred, 18),
            });

            res.json({ message: 'Funds transferred successfully', txHash: result.txHash });
        } else {
            res.json({ message: result.message });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cron job для проверки балансов инвойсов
cron.schedule('*/5 * * * *', async () => {
    const invoices = await AppDataSource.manager.find(Invoice, { where: { status: 'pending' } });
    invoices.forEach(async (invoice) => {
        const projectData = projectConfig.projects[invoice.project];
        if (!projectData) {
            console.error("Invalid project in invoice:", invoice.project);
            return;
        }

        const provider = new ethers.JsonRpcProvider(getRpcUrl(invoice.network));
        const balance = await provider.getBalance(invoice.wallet_address);

        if (balance > 0) {
            invoice.amount = ethers.formatUnits(balance, 18);
            invoice.status = 'completed';
            await AppDataSource.manager.save(invoice);

            // Перевод средств на project.address
            const wallet = new ethers.Wallet(invoice.private_key, provider);
            const tx = await wallet.sendTransaction({
                to: projectData.address, // Используем адрес проекта из конфига
                value: balance
            });
            await tx.wait();

            // Отправка успеха
            await axios.post(projectData.success_url, { status: "success", invoice });
        } else {
            // Отправка неудачи через 30 минут, если баланс не изменился
            const currentTime = new Date().getTime();
            const createdAt = new Date(invoice.createdAt).getTime();
            const timePassed = (currentTime - createdAt) / (1000 * 60); // время в минутах

            if (timePassed >= 30) {
                invoice.status = 'failed';
                await AppDataSource.manager.save(invoice);
                await axios.post(projectData.fail_url, { status: "fail", invoice });
            }
        }
    });
});

const getRpcUrl = (network) => {
    const rpcUrls = {
        Polygon: "https://polygon-rpc.com",
        Ethereum: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
        // Другие RPC...
    };
    return rpcUrls[network];
};

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
