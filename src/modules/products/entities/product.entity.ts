import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PointRequestedProduct } from 'src/modules/distriuition-points/entities/point-requested-product.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'varchar', length: 160 })
  name!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  unit!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @OneToMany(() => PointRequestedProduct, (rp) => rp.product)
  requestedInPoints!: PointRequestedProduct[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
