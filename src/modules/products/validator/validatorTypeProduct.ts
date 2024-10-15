import { BadRequestException } from "@nestjs/common";
import { CreateProduct, UpdateProduct } from "../dto";
import { ProductType } from "../enums/products.enum";

export function validatorTypeProduct(data: CreateProduct | UpdateProduct) {
  // Verifica se o tipo é alimento e se o peso foi fornecido corretamente
  if (data.type === ProductType.PERISHABLE || data.type === ProductType.NON_PERISHABLE) {
    if (!data.weight || data.weight <= 0) {
      throw new BadRequestException("A unidade de medida peso é necessária para produtos alimentares.");
    }
  }

  // Se o tipo não for alimentício (PERECÍVEL ou NÃO PERECÍVEL), o peso não deve ser fornecido
  if (data.type !== ProductType.PERISHABLE && data.type !== ProductType.NON_PERISHABLE && data.weight) {
    throw new BadRequestException("A unidade de medida peso é inválida para produtos não alimentares.");
  }

  // Se o tipo for 'OUTROS' e a descrição não for fornecida
  if (data.type === ProductType.OTHER && !data.description) {
    throw new BadRequestException("É obrigatório informar a descrição para produtos sem categoria.");
  }
}
