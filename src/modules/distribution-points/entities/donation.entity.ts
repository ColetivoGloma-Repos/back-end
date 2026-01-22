import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/auth/entities/auth.enity';
import { PointRequestedProduct } from './point-requested-product.entity';
import { DonationStatus } from '../shared';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.donations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column({ type: 'uuid' })
  requestedProductId!: string;

  @ManyToOne(
    () => PointRequestedProduct,
    (requestedProduct) => requestedProduct.donations,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'requestedProductId' })
  requestedProduct!: PointRequestedProduct;

  @Index()
  @Column({ type: 'uuid' })
  pointId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.ACTIVE,
  })
  status!: DonationStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
