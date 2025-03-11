import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from 'src/modules/auth/entities/auth.enity'; 
import { DistribuitionPoints } from 'src/modules/distriuition-points/entities/distribuition-point.entity';
@Entity('files')
export class FileEntity {
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

  @ManyToOne(() => User, user => user.files, { nullable: true })
  user: User;

  @ManyToOne(() => DistribuitionPoints, dp => dp.files, { nullable: true })
  distribuitionPoint: DistribuitionPoints;
}