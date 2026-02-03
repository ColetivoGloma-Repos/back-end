export const PointRequestedProductsMessagesHelper = {
  INVALID_QUANTITY_SOLICITED: 'Quantidade solicitada inválida.',
  SOLICITATION_NOT_FOUND: 'Solicitação não encontrada.',
  PRODUCT_NOT_ACEPTING_DONATIONS:
    'Este produto não está aceitando mais doações no momento.',
  QUANTITY_EXCEEDS_REQUESTED: (maxQuantity: number) =>
    `A quantidade da doação excede a quantidade solicitada. Máximo atual: ${maxQuantity}`,
  GOAL_ALREADY_REACHED: 'A meta de doações para este produto já foi atingida.',
  REQUESTED_QUANTITY_LESS_THAN_DONATED:
    'A quantidade solicitada não pode ser menor do que o total já doado.',
  ONLY_OWNER_OR_ADMIN_CAN_CREATE:
    'Apenas o proprietário ou um administrador podem criar solicitações para este ponto.',
  ONLY_OWNER_OR_ADMIN_CAN_UPDATE:
    'Apenas o proprietário ou um administrador podem atualizar esta solicitação.',
  ONLY_OWNER_OR_ADMIN_CAN_DELETE:
    'Apenas o proprietário ou um administrador podem deletar esta solicitação.',
  ONLY_OWNER_OR_ADMIN_CAN_CONFIRM_DELIVERY:
    'Apenas o proprietário ou um administrador podem confirmar a entrega desta solicitação.',
};

export const DistributionPointsMessagesHelper = {
  POINT_NOT_FOUND: 'Ponto de distribuição não encontrado.',
  POINT_NOT_FOUND_AFTER_CREATION:
    'Ponto de distribuição não encontrado após criação.',
  PRODUCTS_ALREADY_REQUESTED: (names: string[]) => {
    const list = names.join(', ');
    return `Os seguintes produtos já estão cadastrados neste ponto: ${list}.`;
  },
  REPORT_ONE_PRODUCT: 'Informe ao menos 1 produto.',
  INVALID_FIELD_IN_REQUESTED_PRODUCTS: (fieldName: string) =>
    `${fieldName} inválido em produtos solicitados.`,
  FIELD_IS_REQUIRED: (fieldName: string) =>
    `O campo ${fieldName} é obrigatório.`,
  FIELD_INVALID: (fieldName: string) => `O campo ${fieldName} é inválido.`,
  INVALID_USER_FOR_CREATION: 'Usuário inválido para criação do ponto.',
  ONLY_OWNER_OR_ADMIN_CAN_UPDATE:
    'Apenas o proprietário ou um administrador podem atualizar este ponto de distribuição.',
  ONLY_OWNER_OR_ADMIN_CAN_DELETE:
    'Apenas o proprietário ou um administrador podem deletar este ponto de distribuição.',
};

export const DonationMessagesHelper = {
  DONATION_NOT_FOUND: 'Doação não encontrada.',
  DONATION_NOT_ACTIVE: 'A doação não está ativa.',
  ONLY_ADMIN_CAN_CREATE_FOR_OTHERS:
    'Apenas administradores podem criar doações em nome de outros usuários.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
};
