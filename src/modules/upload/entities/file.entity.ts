import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/modules/auth/entities/auth.enity';
import { DistributionPoint } from 'src/modules/distribution-points/entities';

@Entity('files')
export class FileUploadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  url: string;

  @Column()
  ref: string;

  @Column()
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.files, { nullable: true })
  user: User;

  @ManyToOne(() => DistributionPoint, (dp) => dp.files, { nullable: true })
  distribuitionPoint: DistributionPoint;
}
