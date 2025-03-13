import { BadRequestException, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "../auth/entities/auth.enity";
import { InjectRepository } from "@nestjs/typeorm";
import { RequestCoordinator } from "./dto/RequestCoordinators";
import { Paginate } from "src/common/interface";
import { ChangeCoordinatorStatusDto } from "./dto/ChangeCoordinatorStatusDto";
import { CoordinatorDto } from "./dto/CoordinatorsDto";

@Injectable()
export class AdminService {
    constructor(@InjectRepository(User)
        private usersRepository: Repository<User>,){}


    async findAllCoordinator(query: RequestCoordinator): Promise<Paginate<CoordinatorDto>> {
        
    const queryBuilder = this.usersRepository.createQueryBuilder('c')
    
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

}