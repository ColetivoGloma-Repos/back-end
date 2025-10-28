import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  message: string;

  @Column()
  severity: string;

  @Column()
  userId: string;
  
  @CreateDateColumn()
  createdAt: Date;
}