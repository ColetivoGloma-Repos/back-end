import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
  ManyToOne,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Address } from '../entities/adress.enity';
import { NeedVolunteers } from 'src/modules/need/entities/needVolunteers.entity';
import { Shelter } from 'src/modules/shelter/entities/shelter.entity';
import { DistribuitionPoints } from 'src/modules/distriuition-points/entities/distribuition-point.entity';

export enum Status {
  WAITING = 'waiting',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToOne(() => Address)
  @JoinColumn()
  address: Address;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  birthDate: string;

  @Column()
  isCoordinator: boolean;

  @Column('simple-array')
  roles: string[];

  @Column({ nullable: true })
  hasVehicle: boolean;

  @Column({ nullable: true })
  vehicleType: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.WAITING,
  })
  status: Status;

  @ManyToMany(() => NeedVolunteers, (volunteer) => volunteer.volunteers)
  needVolunteers: NeedVolunteers[];

  @Column({ nullable: true })
  code: string;

  @ManyToMany(() => Shelter, (shelter) => shelter.coordinators, {
    nullable: true,
  })
  shelters: Shelter[];

  @OneToMany(
    () => DistribuitionPoints,
    (distribuitionPoints) => distribuitionPoints.creator,
    { nullable: true },
  )
  myDistribuitionPoints: DistribuitionPoints[];

  @OneToMany(() => Shelter, (shelter) => shelter.creator, {
    nullable: true,
  })
  myShelters: Shelter[];
}
