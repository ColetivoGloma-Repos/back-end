export const CommonMessagesHelper = {
  NOT_FOUND: (entity: string) => `${entity} não encontrado.`,
  FIELD_IS_REQUIRED: (fieldName: string) =>
    `O campo ${fieldName} é obrigatório.`,
  FIELD_INVALID: (fieldName: string, type: string) =>
    `O campo ${fieldName} é inválido. Esperado: ${type}.`,
  FIELD_INVALID_LENGTH: (fieldName: string) =>
    `O campo ${fieldName} tem um tamanho inválido.`,
};
