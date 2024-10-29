import { Request } from '@nestjs/common';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductType } from '../enums/products.enum';
import { DistribuitionPoints } from 'src/modules/distriuition-points/entities/distribuition-point.entity';
import { User } from 'src/modules/auth/entities/auth.enity';
import { ProductStatus } from '../enums/product.status';

@Entity()
export class Products {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.OTHER,
  })
  type: ProductType;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.REQUESTED,
  })
  status: ProductStatus;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({  type: 'decimal', precision: 10, scale: 2, default: 0 })
  weight: number;
 
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user)
  creator: User;

  @ManyToOne(
    () => DistribuitionPoints,
    (distribuitionPoints) => distribuitionPoints.products,
    { nullable: true },
  )
  distribuitionPoint: DistribuitionPoints;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
