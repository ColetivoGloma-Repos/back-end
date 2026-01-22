export const PointRequestedProductsMessagesHelper = {
  INVALID_QUANTITY_SOLICITED: 'Quantidade solicitada inválida.',
  SOLICITATION_NOT_FOUND: 'Solicitação não encontrada.',
  PRODUCT_NOT_ACEPTING_DONATIONS:
    'Este produto não está aceitando doações no momento.',
  QUANTITY_EXCEEDS_REQUESTED: (maxQuantity: number) =>
    `A quantidade da doação excede a quantidade solicitada. Máximo atual: ${maxQuantity}`,
  GOAL_ALREADY_REACHED: 'A meta de doações para este produto já foi atingida.',
};

export const DistributionPointsMessagesHelper = {
  POINT_NOT_FOUND: 'Ponto de distribuição não encontrado.',
  PRODUCT_ALREADY_REQUESTED: 'Este produto já está solicitado neste ponto.',
};

export const DonationMessagesHelper = {
  DONATION_NOT_FOUND: 'Doação não encontrada.',
  DONATION_NOT_ACTIVE: 'A doação não está ativa.',
};
