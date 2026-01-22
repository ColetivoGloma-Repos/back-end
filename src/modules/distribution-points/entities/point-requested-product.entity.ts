import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Donation } from './donation.entity';
import { DistributionPoint } from './distribution-point.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { RequestedProductStatus } from '../shared';

@Entity('point_requested_products')
@Unique('uq_point_product_active', ['pointId', 'productId'])
export class PointRequestedProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  pointId!: string;

  @ManyToOne(() => DistributionPoint, (p) => p.requestedProducts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pointId' })
  point!: DistributionPoint;

  @Index()
  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.requestedInPoints, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'int' })
  requestedQuantity!: number;

  @Column({ type: 'int', default: 0 })
  donatedQuantity!: number;

  @Column({
    type: 'enum',
    enum: RequestedProductStatus,
    default: RequestedProductStatus.OPEN,
  })
  status!: RequestedProductStatus;

  @Column({ type: 'timestamptz', nullable: true })
  closesAt!: Date | null;

  @OneToMany(() => Donation, (d) => d.requestedProduct)
  donations!: Donation[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
