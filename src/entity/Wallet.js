// src/entity/Wallet.js
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Wallet {
    @PrimaryGeneratedColumn()
    id;

    @Column()
    network;

    @Column()
    project;

    @Column()
    user_id;

    @Column()
    wallet_address;

    @Column()
    private_key;
}
