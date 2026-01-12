import { BadRequestException, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "../auth/entities/auth.enity";
import { InjectRepository } from "@nestjs/typeorm";
import { RequestCoordinator } from "./dto/RequestCoordinators";
import { Paginate } from "src/common/interface";
import { ChangeCoordinatorStatusDto } from "./dto/ChangeCoordinatorStatusDto";
import { CoordinatorDto } from "./dto/CoordinatorsDto";
import { EAuthRoles, Status } from "../auth/enums/auth";

@Injectable()
export class DashboardService {
    constructor(@InjectRepository(User)
        private usersRepository: Repository<User>,){}

    async findAllCoordinator(query: RequestCoordinator): Promise<Paginate<CoordinatorDto>> {

    const queryBuilder = this.usersRepository.createQueryBuilder('c').leftJoinAndSelect('c.files', 'files')

    if (query.search) {

    const formattedSearch = `%${query.search.toLowerCase().trim()}%`;

    queryBuilder.andWhere('LOWER(c.name) LIKE :search', {
        search: formattedSearch,
    });

    }
    const sortBy = query.sortBy ? `c.${query.sortBy}` : 'c.name';
    const order = query.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    queryBuilder.orderBy(sortBy, order as 'ASC' | 'DESC');

    const limit = parseInt(query.limit as string, 10) || 10;
    const offset = parseInt(query.offset as string, 10) || 0;

    queryBuilder.skip(offset).take(limit);
    
    const [data, total] = await queryBuilder.getManyAndCount();
    const coordinatorDto = data.map((c) => new CoordinatorDto(c))
    return {
      data: coordinatorDto,
      total,
    };
    }

    async changeCoordinatorStatus(data: ChangeCoordinatorStatusDto): Promise<string> {
        try {   
            const coordinator = await this.usersRepository.findOne({
                where: { id: data.id }
            })
            if (!coordinator) {
                throw new BadRequestException("Coordenador não encontrado.")
            }
            coordinator.status = data.status;

            await this.usersRepository.save(coordinator)
            return coordinator.status.toString();
        } catch (e) {
            throw e;
        }
    }

  async findAllAdminInitiative(query: RequestCoordinator): Promise<Paginate<CoordinatorDto>> {
  const queryBuilder = this.usersRepository
    .createQueryBuilder('a')
    .leftJoinAndSelect('a.files', 'files');

  if (query.search) {
    const formattedSearch = `%${query.search.toLowerCase().trim()}%`;

    queryBuilder.andWhere('LOWER(a.name) LIKE :search', { search: formattedSearch });
    queryBuilder.orWhere('LOWER(a.email) LIKE :search', { search: formattedSearch });
  }

  queryBuilder.andWhere(`'initiative-administrator' = ANY(a.roles)`);

  const sortBy = query.sortBy ? `a.${query.sortBy}` : 'a.name';
  const order = query.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  queryBuilder.orderBy(sortBy, order as 'ASC' | 'DESC');
  const limit = parseInt(query.limit as string, 10) || 10;
  const offset = parseInt(query.offset as string, 10) || 0;
  queryBuilder.skip(offset).take(limit);
 
  const [data, total] = await queryBuilder.getManyAndCount();
   console.log(data)
  const coordinatorDto = data.map((c) => new CoordinatorDto(c));

  return {
    data: coordinatorDto,
    total,
  };
}
/*
 async changeAdminInitiativeStatus(data: ChangeCoordinatorStatusDto): Promise<string> {
    try {   
        const coordinator = await this.usersRepository.findOne({
            where: { id: data.id }
        })
        if (!coordinator) {
            throw new BadRequestException("Coordenador não encontrado.")
        }
        if (data.status !== Status.APPROVED) {
        coordinator.roles = coordinator.roles.filter(
            role => role !== EAuthRoles.INITIATIVE_ADMIN
        );        
        coordinator.isAdminInitiative = false;
        } else {
        if (!coordinator.roles.includes(EAuthRoles.INITIATIVE_ADMIN)) {
            coordinator.roles.push(EAuthRoles.INITIATIVE_ADMIN);
        }
        coordinator.isAdminInitiative = true;
        }
        await this.usersRepository.save(coordinator)
        return coordinator.status.toString();
        } catch (e) {
            throw e;
        }
    }
*/

}
