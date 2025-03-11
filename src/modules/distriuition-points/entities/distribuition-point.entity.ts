import { Address } from 'src/modules/auth/entities/adress.enity';
import { User } from 'src/modules/auth/entities/auth.enity';
import { Products } from 'src/modules/products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusDistributionPoint } from '../enums/distribuition-point.enum';
import { FileEntity } from 'src/modules/company/entities/file.entity';
@Entity()
export class DistribuitionPoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phone: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => FileEntity, file => file.distribuitionPoint)
  files: FileEntity[];

  @OneToOne(() => Address, (address) => address)
  @JoinColumn()
  address: Address;

  @ManyToOne(() => User, (user) => user.myDistribuitionPoints)
  @JoinColumn()
  creator: User;

  @OneToMany(() => Products, (products) => products.distribuitionPoint, {
    nullable: true,
  })
  @JoinColumn()
  products: Products[];

  @Column({ type: 'enum', enum: StatusDistributionPoint, default: StatusDistributionPoint.PENDING })
  status: StatusDistributionPoint

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
