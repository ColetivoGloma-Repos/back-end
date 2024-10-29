import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DistribuitionPoints } from './entities/distribuition-point.entity';
import { Brackets, Repository } from 'typeorm';
import { CreateDistribuitionPoin, UpdateDistribuitionPoin } from './dto';
import { DistribuitionPointMessagesHelper } from './helpers/distribuition-point.helper';
import { User } from '../auth/entities/auth.enity';
import { Address } from '../auth/entities/adress.enity';
import { Products } from '../products/entities/product.entity';
import { ProductService } from './../products/product.service';
import { ProductMessagesHelper } from '../products/helpers/product.helper';
import { CreateUserDto } from '../auth/dto/auth.dto';
import { SearchDistribuitionPoin } from './dto/search-distribuition-point';
import { Paginate } from 'src/common/interface';
import { ProductType } from '../products/enums/products.enum';
import { ProductStatus } from '../products/enums/product.status';

@Injectable()
export class DistribuitionPointsService {
  constructor(
    @InjectRepository(DistribuitionPoints)
    private distribuitionPointsRepository: Repository<DistribuitionPoints>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
    @Inject(forwardRef(() => ProductService))
    private productService: ProductService,
  ) {}

  public async create(
    createDistribuitionPoin: CreateDistribuitionPoin,
    currentUser: CreateUserDto,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: currentUser.id },
    });

    const distibuitionPoint = this.distribuitionPointsRepository.create(
      createDistribuitionPoin,
    );

    const address = new Address();
    Object.assign(address, createDistribuitionPoin.address);
    const saveAddress = await this.addressRepository.save(address);

    distibuitionPoint.address = saveAddress;
    distibuitionPoint.creator = user;

    await this.distribuitionPointsRepository.save(distibuitionPoint);

    return distibuitionPoint;
  }

  public async update(update: UpdateDistribuitionPoin, id: string) {
    const distribuitionPoint = await this.findOne(id, { address: true });

    const newDistribuitionPoint = {
      ...distribuitionPoint,
      ...update,
      address: {
        ...distribuitionPoint.address,
        ...update.address,
      },
    };

    if (update.address) {
      const saveAddress = await this.addressRepository.save(
        newDistribuitionPoint.address,
      );
      newDistribuitionPoint.address = saveAddress;
    }

    const saveDistribuitionPoin = await this.distribuitionPointsRepository.save(
      newDistribuitionPoint,
    );

    return saveDistribuitionPoin;
  }

  public async listAll(
    query: SearchDistribuitionPoin,
  ): Promise<Paginate<DistribuitionPoints>> {
    const queryBuilder = this.distribuitionPointsRepository
      .createQueryBuilder('dp')
      .leftJoinAndSelect('dp.address', 'address');

    if (query.search) {
      const formattedSearch = `%${query.search.toLowerCase().trim()}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(dp.name) LIKE :search', { search: formattedSearch })
            .orWhere('LOWER(dp.description) LIKE :search', {
              search: formattedSearch,
            })
            .orWhere('LOWER(dp.phone) LIKE :search', {
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
  }

  public async findOne(
    id: string,
    relations?: { address?: boolean; creator?: boolean },
  ) {
    const distribuitionPoint = await this.distribuitionPointsRepository.findOne(
      {
        where: { id },
        relations,
      },
    );

    if (!distribuitionPoint) {
      throw new NotFoundException(
        DistribuitionPointMessagesHelper.DISTRIBUITION_POINT_NOT_FOUND,
      );
    }

    return distribuitionPoint;
  }

  public async remove(id: string) {
    const distribuitionPoint = await this.findOne(id);
    distribuitionPoint.deletedAt = new Date();

    await this.distribuitionPointsRepository.save(distribuitionPoint);

    return {
      message: DistribuitionPointMessagesHelper.DISTRIBUITION_POINT_DELETED,
    };
  }

  async addProduct(
    distribuitionPointId: string,
    productId: string,
    currentUser: CreateUserDto,
  ) {
    const distribuitionPoint = await this.findOne(distribuitionPointId);

    const product = await this.productService.findOne(productId, {
      creator: true,
      distribuitionPoint: true,
    });

    if (!product) {
      throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
    }
    if (product.creator.id !== currentUser.id) {
      throw new ForbiddenException(
        DistribuitionPointMessagesHelper.ONLY_PRODUCT_CREATOR_CAN_ADD_OR_REMOVE,
      );
    }
    if (distribuitionPoint.id === product.distribuitionPoint.id) {
      throw new NotFoundException(
        ProductMessagesHelper.PRODUCT_ALREADY_ASSOCIATED,
      );
    }

    await this.productsRepository.save({ ...product, distribuitionPointId });

    return {
      message:
        DistribuitionPointMessagesHelper.PRODUCT_ADDED_DISTRIBUITION_POINT,
    };
  }

  async removeProduct(
    distribuitionPointId: string,
    productId: string,
    currentUser: CreateUserDto,
  ) {
    const distribuitionPoint = await this.findOne(distribuitionPointId);

    const product = await this.productService.findOne(productId, {
      creator: true,
      distribuitionPoint: true,
    });

    if (!product || distribuitionPoint.id !== product.distribuitionPoint.id) {
      throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
    }
    if (product.creator.id !== currentUser.id) {
      throw new ForbiddenException(
        DistribuitionPointMessagesHelper.ONLY_PRODUCT_CREATOR_CAN_ADD_OR_REMOVE,
      );
    }

    await this.productsRepository.delete(productId);

    return {
      message:
        DistribuitionPointMessagesHelper.PRODUCT_REMOVED_DISTRIBUITION_POINT,
    };
  }

  async statistics(distributionPointId: string, status: ProductStatus) {
    // Obtém o peso total dos produtos no ponto de distribuição
    const totalProducts = await this.totalWeight(distributionPointId);
    // Obtém a quantidade total dos produtos no ponto de distribuição
    const totalQuantityProduct = await this.totalProducts(distributionPointId);
    
    //converte o enum para um array, assim pode pesquisar
    const productTypesArray = Object.values(ProductType);

    //retira os alimentos, para que não crie confusão
    const productTypesArrayUpdate = productTypesArray.filter(
      p => p !== ProductType.PERISHABLE && p !== ProductType.NON_PERISHABLE
    );   
    
    //função responsável por acionar a função de pesquisa de product.
    const productsCount = productTypesArrayUpdate.map(async (t) => {
      return this.countProductsByType(t, distributionPointId, status)
    })

  
    //Através do paralelismo, chama a função que chama a função de conta, evitando sobrecarga no sistema. 
    const productResult = await Promise.all(productsCount);     
    const products = productResult.flat();

    //Muda para array de produtor perecíveis e não perecíveis
    const productTypesFoodArrayUpdate = productTypesArray.filter(
      p => p === ProductType.PERISHABLE || p === ProductType.NON_PERISHABLE
    );
    //cria a função de consulta
    const productsFoodCount = productTypesFoodArrayUpdate.map(async (t) => {
      return this.countProductsFood(t, distributionPointId)
    })
    //chama como o paralelismo
    const productFoodResult = await Promise.all(productsFoodCount);     
    const productsFood = productFoodResult.flat();
    
    return {
      totalProducts: totalProducts.totalWeight || 0,
      totalQuantityProducts: totalQuantityProduct.totalQuantity || 0,
      products,
      productsFood
    };
  }
  
  private async countProductsByType(type: ProductType, distributionPointId: string, status: ProductStatus): Promise<any>{
    
    const count = await this.productsRepository
    .createQueryBuilder('products')
    .select('SUM(products.quantity)', 'totalQuantity')
    .where('products.distribuitionPoint = :distributionPointId AND products.type = :type', {
      distributionPointId,
      type: type,
    })
    .andWhere('products.status != :status', { status: status }) 
    .getRawOne();

    interface IProduct {
      name: string;
      qtd: number;
    }
    const product: IProduct = {
      name: type.toString(),
      qtd: Number(count.totalQuantity) || 0
    }
    return product
  }

  private async countProductsFood(type: ProductType, distributionPointId: string): Promise<any>{
    
    const count = await this.productsRepository
    .createQueryBuilder('products')
    .select('SUM(products.quantity)', 'totalQuantity')
    .addSelect('SUM(products.weight)', 'totalWeight')
    .where('products.distribuitionPoint = :distributionPointId AND products.type = :type', {
        distributionPointId,
        type: type,
    })
    .getRawOne();

    interface IProduct {
      name: string;
      qtd: number;
      weight: number;
    }
    const product: IProduct = {
      name: type.toString(),
      qtd: Number(count.totalQuantity) || 0,
      weight: Number(count.totalWeight) || 0
    }
    return product
  }

  private async totalWeight(distributionPointId: string){
    return await this.productsRepository
    .createQueryBuilder('products')
    .select('SUM(products.weight)', 'totalWeight')
    .where('products.distribuitionPoint = :distributionPointId', { distributionPointId })
    .getRawOne();
  }

  private async totalProducts(distributionPointId: string){
    return await this.productsRepository
    .createQueryBuilder('products')
    .select('SUM(products.quantity)', 'totalQuantity')
    .where('products.distribuitionPoint = :distributionPointId', { distributionPointId })
    .getRawOne();
  }
}
