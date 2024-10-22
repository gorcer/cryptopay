// src/entity/Invoice.js
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn()
    id;

    @Column()
    wallet_address;

    @Column()
    project;

    @Column()
    network;

    @Column({ default: 0 })
    amount;

    @Column()
    status;

}
