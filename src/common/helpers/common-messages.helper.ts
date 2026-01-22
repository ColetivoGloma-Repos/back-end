export const CommonMessagesHelper = {
  NOT_FOUND: (entity: string) => `${entity} não encontrado.`,
  FIELD_IS_REQUIRED: (fieldName: string) =>
    `O campo "${fieldName}" é obrigatório.`,
  FIELD_INVALID: (fieldName: string) => `O campo "${fieldName}" é inválido.`,
  FIELD_INVALID_TYPE: (fieldName: string, type: string) =>
    `O campo "${fieldName}" deve ser do tipo ${type}.`,
  FIELD_MIN_LENGTH: (fieldName: string, min: number) =>
    `O campo "${fieldName}" deve ter no mínimo ${min} caracteres.`,
  FIELD_MAX_LENGTH: (fieldName: string, max: number) =>
    `O campo "${fieldName}" deve ter no máximo ${max} caracteres.`,
  FIELD_LENGTH_BETWEEN: (fieldName: string, min: number, max: number) =>
    `O campo "${fieldName}" deve ter entre ${min} e ${max} caracteres.`,
  FIELD_INVALID_ENUM: (fieldName: string) =>
    `O campo "${fieldName}" possui um valor inválido.`,
};
