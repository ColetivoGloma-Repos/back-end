import { Address } from 'src/modules/auth/entities/adress.enity';
import { User } from 'src/modules/auth/entities/auth.enity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FileUploadEntity } from 'src/modules/upload/entities/file.entity';
import { PointRequestedProduct } from './point-requested-product.entity';
import { DistributionPointStatus } from '../shared';

@Entity('distribution_points')
export class DistributionPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  phone: string;

  @Index()
  @Column({ type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.ownedDistributionPoints, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @OneToMany(
    () => PointRequestedProduct,
    (requestedProduct) => requestedProduct.point,
  )
  requestedProducts!: PointRequestedProduct[];

  @Column({
    type: 'enum',
    enum: DistributionPointStatus,
    default: DistributionPointStatus.PENDING,
  })
  status: DistributionPointStatus;

  @OneToOne(() => Address, (address) => address)
  @JoinColumn()
  address: Address;

  @ManyToMany(() => User, (user) => user.distributionPointCoordinators, {
    nullable: true,
  })
  @JoinTable()
  coordinators: User[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => FileUploadEntity, (file) => file.distribuitionPoint)
  files: FileUploadEntity[];
}
