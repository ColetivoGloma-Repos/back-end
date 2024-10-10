import { BadRequestException } from "@nestjs/common";
import { CreateProduct, UpdateProduct } from "../dto";
import { ProductType } from "../enums/products.enum";

export function validatorTypeProduct(data: CreateProduct | UpdateProduct){
      /*Notas: Presuma-se se a classificação for categorizado perecível ou não, é alimento, 
      então verifica parâmetro quilo foi passado, se for verdade, dará exception, pois 
      quilo é referente somente a alimento.
      .*/
    
      if (data.type !== ProductType.PERISHABLE && data.weight != null) {
        throw new BadRequestException("Unidade de medida inválida para não alimentos.");
      }
      
      if (data.type === ProductType.PERISHABLE && !data.weight) {
          throw new BadRequestException("Unidade de medida inválida para alimentos perecíveis.");
      }
    
      if(data.type === ProductType.OTHER && data.description == null){
        throw new BadRequestException("É obrigatório informar a descrição se não houver categoria.");
      }
   
}