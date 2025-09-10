import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  Brackets,
  FindManyOptions,
  FindOptionsWhere,
  Like,
  Repository,
} from 'typeorm';
import { Products } from './entities/product.entity';
import { CreateProduct, UpdateProduct } from './dto';
import { ProductMessagesHelper } from './helpers/product.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { DistribuitionPointsService } from '../distriuition-points/distribuition-point.service';
import { User } from '../auth/entities/auth.enity';
import { CreateUserDto } from '../auth/dto/auth.dto';
import { SearchProduct } from './dto/search-product';
import { Paginate } from 'src/common/interface';
import { ProductType } from './enums/products.enum';
import logger from 'src/logger';
import { validatorTypeProduct } from './validator/validatorTypeProduct';
import { CreateProductDonate } from './dto/create-product-donate';
import { ProductStatus } from './enums/product.status';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => DistribuitionPointsService))
    private distribuitionPointService: DistribuitionPointsService,
  ) {}

  public async create(
    createProduct: CreateProduct,
    currentUser: CreateUserDto,
  ) {
    try{
    const user = await this.usersRepository.findOne({
      where: { id: currentUser.id },
    });
    validatorTypeProduct(createProduct);
    const product = this.productsRepository.create(createProduct);
    if (createProduct.distributionPointId) {
      const distributionPointId = await this.distribuitionPointService.findOne(
      createProduct.distributionPointId,
    );
    if(!distributionPointId){
        throw new BadRequestException("Ponto de distribuição não encontrado")
    }
    
    product.distribuitionPoint = distributionPointId;
    
    }

    product.creator = user;

    await this.productsRepository.save(product);

    return product;
  }  catch (error) {
    logger.error(error);
    throw error
   }  
  }

  public async update(updateProduct: UpdateProduct, id: string) {
    try {
      const product = await this.findOne(id);
      if(product.weight == 0.00 && updateProduct.weight > 0.00){
          throw new BadRequestException("Peso não pode ser adicionado a produtos não alimentares");
      }   
     
      const newProduct = {
        ...product,
        ...updateProduct,
      };
  
      const saveProduct = await this.productsRepository.save(newProduct);
  
      return saveProduct;
    } catch (error) {
      logger.error(error);
      throw error
     }  
    }
   

  public async findOne(
    id: string,
    relations?: { distribuitionPoint?: boolean; creator?: boolean },
  ) {
    const products = await this.productsRepository.findOne({
      where: { id },
      relations,
      select: {
        distribuitionPoint: {
          id: true,
        },
      },
    });
    if (!products) {
      throw new NotFoundException(ProductMessagesHelper.PRODUCT_NOT_FOUND);
    }
    return products;
  }

  public async listAll(
    query: SearchProduct,
    relations?: { distribuitionPoint?: boolean; creator?: boolean },
  ): Promise<Paginate<Products>> {
    const distribuitionPointId = query.distribuitionPointId;

    const queryBuilder = this.productsRepository.createQueryBuilder('product');

    if (relations?.distribuitionPoint) {
      queryBuilder
        .leftJoin('product.distributionPoint', 'distributionPoint')
        .addSelect(['distributionPoint.id']);
    }
    if (relations?.creator) {
      queryBuilder
        .leftJoin('product.creator', 'creator')
        .addSelect(['creator.id']);
    }
    
    if (query.search) {
      const formattedSearch = `%${query.search.toLowerCase().trim()}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(product.name) LIKE :search', {
            search: formattedSearch,
          }).orWhere('LOWER(product.description) LIKE :search', {
            search: formattedSearch,
          });
        }),
      );
    }
    if (query.type) {
      queryBuilder.andWhere('product.type = :type', { type: query.type });
    }
    
    if (query.status) {
      queryBuilder.andWhere('product.status = :status', { status: `${query.status}` });
    }
    if (distribuitionPointId) {
      await this.distribuitionPointService.findOne(distribuitionPointId);
      queryBuilder.andWhere(
        'product.distribuitionPointId = :distribuitionPointId',
        { distribuitionPointId },
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

  public async delete(id: string) {
    await this.findOne(id);
    await this.productsRepository.delete(id);
  }


  async donor(createProduct: CreateProductDonate, currentUser: CreateUserDto) {
    try {
      // 1. Busca o produto de referência
      const productRequested = await this.productsRepository.findOne({
        where: { id: createProduct.productReferenceID },
        relations: ['distribuitionPoint']
      });
  
      if (!productRequested) {
        throw new Error('Produto de referência não encontrado');
      }
  
      const donatedQuantity = Number(createProduct.quantity) || 0;
      let donatedWeight = 0;
  
      if (createProduct.weight !== undefined && createProduct.weight !== null) {
        donatedWeight = parseFloat(createProduct.weight.toString().replace(',', '.'));
       
        if (isNaN(donatedWeight)) {
          donatedWeight = 0;
        } else {
          donatedWeight = parseFloat(donatedWeight.toFixed(2));
        }
      }
  
      const newProduct = new Products();
      newProduct.distribuitionPoint = productRequested.distribuitionPoint;
      newProduct.name = productRequested.name;
      newProduct.type = productRequested.type;
      newProduct.status = ProductStatus.RECEIVED;
      newProduct.quantity = donatedQuantity;
      newProduct.weight = donatedWeight; 

      if (productRequested.type === ProductType.PERISHABLE || 
          productRequested.type === ProductType.NON_PERISHABLE) {
        
        const currentWeight = parseFloat(productRequested.weight.toString()) || 0;
        productRequested.weight = parseFloat((currentWeight - donatedWeight).toFixed(2));
        
        if (productRequested.weight < 0) {
          productRequested.weight = 0;
        }
      }
  
      productRequested.quantity = Math.max(0, productRequested.quantity - donatedQuantity);
 
      const shouldKeepOriginal = productRequested.quantity > 0 || 
                               (productRequested.weight > 0 && 
                                (productRequested.type === ProductType.PERISHABLE || 
                                 productRequested.type === ProductType.NON_PERISHABLE));
  
      if (shouldKeepOriginal) {
        await this.productsRepository.save(productRequested);
      } else {
        await this.productsRepository.delete(productRequested.id);
      }
  
      await this.productsRepository.save(newProduct);
      return newProduct;
  
    } catch (error) {
      logger.error(error);
      throw new Error('Erro ao processar doação: ' + error.message);
    }
  }

}
