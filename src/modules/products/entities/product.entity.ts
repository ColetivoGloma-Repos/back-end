import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PointRequestedProduct } from 'src/modules/distribution-points/entities';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200, nullable: true })
  slug!: string | null;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  unit!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @OneToMany(
    () => PointRequestedProduct,
    (requestedProduct) => requestedProduct.product,
  )
  requestedInPoints!: PointRequestedProduct[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

