// src/repository/WalletRepository.js
export class WalletRepository {
    constructor(dataSource) {
        this.manager = dataSource.manager;
    }

    // Поиск кошелька по network, project и user_id
    async findWalletByDetails(network, project, user_id) {
        return await this.manager.findOne(Wallet, {
            where: { network, project, user_id }
        });
    }

    // Создание и сохранение нового кошелька
    async createWalletRecord(network, project, user_id, wallet_address, private_key) {
        const walletRecord = this.manager.create(Wallet, {
            network,
            project,
            user_id,
            wallet_address,
            private_key
        });
        return await this.manager.save(walletRecord);
    }
}
