import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shelter } from './entities/shelter.entity';
import { ShelterMessagesHelper } from './helpers/shelter.helper';
import { UpdateShelterDto, CreateShelterDto } from './dto';
import { User } from '../auth/entities/auth.enity';
import { Address } from '../auth/entities/adress.enity';

@Injectable()
export class ShelterService {
  constructor(
    @InjectRepository(Shelter)
    private shelterRepository: Repository<Shelter>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  async create(createShelter: CreateShelterDto) {
    const user = await this.usersRepository.findOne({
      where: { id: createShelter.creatorId },
    });
    if (!user) {
      throw new NotFoundException(ShelterMessagesHelper.USER_NOT_FOUND);
    }
    if (user.roles.includes('donor')) {
      throw new ForbiddenException(
        ShelterMessagesHelper.THIS_USER_NOT_COORDINATOR,
      );
    }

    const shelter = this.shelterRepository.create(createShelter);

    const address = new Address();
    Object.assign(address, createShelter.address);
    const saveAddress = await this.addressRepository.save(address);

    shelter.creator = user;
    shelter.coordinators = [user];
    shelter.address = saveAddress;

    await this.shelterRepository.save(shelter);

    return shelter;
  }

  async update(updateShelter: UpdateShelterDto, shelterId: string) {
    const shelter = await this.findOne(shelterId);

    const newShelter = {
      ...shelter,
      ...updateShelter,
    };

    if (updateShelter.creatorId) {
      const creator = await this.usersRepository.findOne({
        where: { id: updateShelter.creatorId },
      });
      if (!creator) {
        throw new NotFoundException(
          ShelterMessagesHelper.COORDINATOR_NOT_FOUND,
        );
      }
      if (creator.roles.includes('donor')) {
        throw new ForbiddenException(
          ShelterMessagesHelper.THIS_USER_NOT_COORDINATOR,
        );
      }
      if (shelter.creator.id === creator.id) {
        throw new NotFoundException(
          ShelterMessagesHelper.SHELTER_COORDINATOR_ALREADY_ASSOCIATED,
        );
      }

      newShelter.creator = creator;
    }

    await this.shelterRepository.save(newShelter);

    return await this.findOne(shelterId);
  }

  async findOne(shelterId: string) {
    const shelter = await this.shelterRepository.findOne({
      where: { id: shelterId },
      relations: { address: true, creator: true, coordinators: true },
      select: {
        coordinators: {
          id: true,
        },
      },
    });
    if (!shelter) {
      throw new NotFoundException(ShelterMessagesHelper.SHELTER_NOT_FOUND);
    }

    return shelter;
  }

  async listAll() {
    return await this.shelterRepository.find({
      relations: { address: true, creator: true, coordinators: true },
      select: {
        coordinators: {
          id: true,
        },
      },
    });
  }

  async remove(shelterId: string) {
    const shelter = await this.findOne(shelterId);
    shelter.deletedAt = new Date();

    await this.shelterRepository.save(shelter);

    return { message: ShelterMessagesHelper.SHELTER_DELETED };
  }

  async addCoordinator(shelterId: string, coordinatorId: string) {
    const shelter = await this.findOne(shelterId);

    const coordinator = await this.usersRepository.findOne({
      where: { id: coordinatorId },
    });
    if (!coordinator) {
      throw new NotFoundException(ShelterMessagesHelper.COORDINATOR_NOT_FOUND);
    }
    if (coordinator.roles.includes('donor')) {
      throw new ForbiddenException(
        ShelterMessagesHelper.THIS_USER_NOT_COORDINATOR,
      );
    }
    const coordinatorExistsInShelter = shelter.coordinators.find(
      (shelterCoordinator) => shelterCoordinator.id === coordinatorId,
    );
    if (coordinatorExistsInShelter) {
      throw new NotFoundException(
        ShelterMessagesHelper.SHELTER_COORDINATOR_ALREADY_ASSOCIATED,
      );
    }

    shelter.coordinators.push(coordinator);

    await this.shelterRepository.save(shelter);

    return { message: 'Coordenador adicionado ao abrigo' };
  }

  async removeCoordinator(shelterId: string, coordinatorId: string) {
    const shelter = await this.findOne(shelterId);

    const coordinator = await this.usersRepository.findOne({
      where: { id: coordinatorId },
    });
    if (!coordinator) {
      throw new NotFoundException(ShelterMessagesHelper.COORDINATOR_NOT_FOUND);
    }
    const coordinatorExistsInShelter = shelter.coordinators.find(
      (shelterCoordinator) => shelterCoordinator.id === coordinatorId,
    );
    if (!coordinatorExistsInShelter) {
      throw new NotFoundException(ShelterMessagesHelper.COORDINATOR_NOT_FOUND);
    }

    shelter.coordinators = shelter.coordinators.filter(
      (coordinatorFilter) => coordinator.id !== coordinatorFilter.id,
    );

    await this.shelterRepository.save(shelter);

    return { message: 'Coordenador removido do abrigo' };
  }
}
