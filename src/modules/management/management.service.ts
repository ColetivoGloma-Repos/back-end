import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { CreateManagementDTO } from "./dto/request/createManagementDTO";
import { Address } from "../auth/entities/adress.enity";
import logger from "src/logger";
import { Management } from "./entities/management.entity";
import { FindNeedsItem } from "./utils/findNeedItem";
import { FindNeedsVolunteer } from "./utils/findNeedVolunteer";
import { VerifyIfUserExits } from "../need/validator/user/verifyIfUserExits";
import { VerifyIfShelterExits } from "../need/validator/shelter/verifyIfShelterExits";
import { createValidator } from "./validators/createValidators";
import { geoResult } from "./utils/geoResult";
import { needValidator } from "./validators/needValidator";
import { UpdateManagementDTO } from "./dto/request/updateManagementDTO";
import { SearchManagement } from "./dto/request/searchManagement";
import { Paginate } from "src/common/interface";

@Injectable()
export class ManagementService {

  constructor(
    @InjectRepository(Management)
    private managementRepository: Repository<Management>,
    private findNeedItem: FindNeedsItem,
    private findNeedVolunteer: FindNeedsVolunteer,
    private verifyIfUserExists: VerifyIfUserExits,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private verifyIfShelterExits: VerifyIfShelterExits,
  ){}

  async create(createManagementDTO: CreateManagementDTO): Promise<Management>{
  try{            
    const management = new Management();
    management.collectionDate = createManagementDTO.collectionDate;

    const coordinator = await this.verifyIfUserExists.verifyIfUserExits(createManagementDTO.coordinatorId);
    createValidator(coordinator);
  
    management.coordinator = coordinator;
  
    const shelter = await this.verifyIfShelterExits.verifyIfShelterExits(createManagementDTO.shelterId);
    management.shelter = shelter;  
    
    const address = new Address();
    Object.assign(address, createManagementDTO.collectPoint);
    const newAddress = await this.addressRepository.create(address);
  
    const addressGeo = await geoResult(newAddress)
    const updatedAddress   = await this.addressRepository.save(addressGeo)
    management.collectPoint = updatedAddress;

    return await this.managementRepository.save(management)
    
   } catch (error) {
     logger.error(error);
     throw error
    }         
  }
  
  async update(id: string, updates: Partial<UpdateManagementDTO>): Promise<Management>{
   
    const management = await this.findById(id);
  
    if(!management){
      throw new BadRequestException('Demanda não encontrada.')
    }
     
    if (updates.collectPoint) {  
      const address = new Address();
      Object.assign(address, updates.collectPoint);
      const newAddress = await this.addressRepository.create(address);  
      const updatedAddress = await geoResult(newAddress)
      management.collectPoint = updatedAddress;
      
      await this.addressRepository.save(updatedAddress);
  }
    return await this.managementRepository.save(management)

  }

  async findById(id: string): Promise<Management>{
  try {
    const management = await this.managementRepository.findOne({
      where: { id: id },
      relations: ['coordinator','collectPoint', 'needItem', 'needVolunteer', 'shelter']
    });
    if(!management){
      return null;
    }
    return management;
    
  } catch (error) {
    logger.error(error);
    throw error
  }
  }

  async findAll(query: SearchManagement):  Promise<Paginate<Management>>{
    try{
      const queryBuilder = this.managementRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.coordinator', 'coordinator')
      .leftJoinAndSelect('m.collectPoint', 'collectPoint')
      .leftJoinAndSelect('m.needItem', 'needItem')
      .leftJoinAndSelect('m.needVolunteer', 'needVolunteer')
      .leftJoinAndSelect('m.shelter', 'shelter');
   
      if(query.search){
        const formattedSearch = `%${query.search.toLowerCase().trim()}%`;
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(shelter.name) LIKE :search', {
              search: formattedSearch,
            })
              .orWhere('LOWER(shelter.description) LIKE :search', {
                search: formattedSearch,
              })
              .orWhere('LOWER(shelter.phone) LIKE :search', {
                search: formattedSearch,
              });
          }),
        );
      }
      const limit = parseInt(query.limit as string, 10) || 10;
      const offset = parseInt(query.offset as string, 10) || 0;
  
      queryBuilder.skip(offset).take(limit);
  
      const [data, total] = await queryBuilder.getManyAndCount();
  
      return {
        data,
        total,
      };
    } catch (error) {
      logger.error(error);
      throw new InternalServerErrorException('Erro ao realizar a pesquisa.')
    }
  }

  async findAllByUser(userId: string): Promise<Management[]>{
    try{
      return await this.managementRepository.find({
        where: {
          coordinator:{
            id: userId
          }
        },
        relations: ['coordinator', 'collectPoint', 'needItem', 'needVolunteer', 'shelter']
      });
    } catch (error) {
      logger.error(error);
      throw new InternalServerErrorException('Erro ao realizar a pesquisa.')
    }
  }

  async delete(demandId: string, coordinatorId: string){
      try {
        const demand = await this.findById(demandId);
        if(!demand){
          throw new BadRequestException("Demanda não encotrada.")
        }

        if(demand.coordinator.id != coordinatorId){
          throw new ForbiddenException("Usuário sem permissão para remover.")
        }

        if(demand){ 
        await this.managementRepository.delete(demandId);
        return { message: 'Demanda deletada com sucesso' };
        }
        throw new InternalServerErrorException('Erro ao registrar.')
        
      } catch (error) {
        logger.error(error);
        throw error;
      }
  }

  async addNeed(managementId: string, needId: string) {
    try {      
      const management = await this.findById(managementId);
      if (!management) {
        throw new BadRequestException('Demanda não encontrada.');
      }
      
      const needItem = await this.findNeedItem.findNeedItemById(needId);
      await needValidator(needItem);
  
      const needVolunteer = await this.findNeedVolunteer.findVolunteerItemById(needId);
      await needValidator(needVolunteer);
  
      if (!needItem && !needVolunteer) {
        throw new BadRequestException('Necessidade não encontrada.');
      }
  
      if (needItem) {
        const alreadyExists = management.needItem.some(
          (item) => item.id === needItem.id,
        );
  
        if (alreadyExists) {
          throw new ConflictException('Necessidade já cadastrada neste ponto de demanda.');
        }  
      
        management.needItem.push(needItem);
      }  
   
      if (needVolunteer) {
        const alreadyExists: boolean = management.needVolunteer.some(
          (item) => item.id === needVolunteer.id,
        );
        if (alreadyExists) {
          throw new ConflictException('Necessidade já cadastrada neste ponto de demanda.');
        }  
        management.needVolunteer.push(needVolunteer);
      }
  
      return await this.managementRepository.save(management);
  
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
  

  async removeNeed(managementId: string, needId: string){
    try{

    const management = await this.findById(managementId);
    
    const needItem = await this.findNeedItem.findNeedItemById(needId);
    const needVolunteer = await this.findNeedVolunteer.findVolunteerItemById(needId)
   
    if (!needItem && !needVolunteer) {
      throw new BadRequestException('Necessidade não encontrada.');
    }

    let exits: boolean = false;

if (needItem) {
  exits = management.needItem.some(item => item.id === needItem.id);
  management.needItem = management.needItem.filter(item => item.id !== needItem.id);
}

if (needVolunteer) {
  exits = management.needVolunteer.some(item => item.id === needVolunteer.id) || exits;  // Manter o valor anterior se algum item já foi encontrado
  management.needVolunteer = management.needVolunteer.filter(item => item.id !== needVolunteer.id);
}

  if (!exits) {
  throw new BadRequestException("Necessidade não encontrada");
  } else {
  await this.managementRepository.save(management);
  return { message: 'Necessidade deletada com sucesso.' };
  }

    
  }catch (error) {
    logger.error(error);
    throw error;
  }
  }
}