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

export const NotificationMessageHelper = {
  POINT_CREATED_TITLE: (bairro: string) => `Novo Ponto em ${bairro}!`,
  POINT_CREATED_MESSAGE: (title: string, cidade: string) =>
    `${title} acabou de abrir em ${cidade}. Toque para ver como ajudar.`,
  POINT_UPDATED_TITLE: 'Novidades no Ponto!',
  POINT_UPDATED_MESSAGE: (title: string) =>
    `O ponto ${title} atualizou suas informações.`,
  POINT_ADDRESS_CHANGED_TITLE: 'Mudamos de Endereço!',
  POINT_ADDRESS_CHANGED_MESSAGE: (title: string, bairro: string) =>
    `O ponto ${title} está agora em ${bairro}. Confira!`,
  POINT_NAME_CHANGED_MESSAGE: (title: string) =>
    `O ponto agora se chama ${title}.`,
  POINT_CLOSED_TITLE: 'Ponto Encerrado',
  POINT_CLOSED_MESSAGE: (title: string) =>
    `O ponto de distribuição "${title}" encerrou suas atividades.`,

  DONATION_REGISTERED_TITLE: 'Doação Realizada!',
  DONATION_REGISTERED_MESSAGE: (
    quantity: number,
    productName: string,
    pointTitle: string,
  ) =>
    `Sua doação de ${quantity}x ${productName} para o ponto "${pointTitle}" foi registrada.`,
  DONATION_RECEIVED_TITLE: 'Nova Doação Recebida!',
  DONATION_RECEIVED_MESSAGE: (
    quantity: number,
    productName: string,
    pointTitle: string,
  ) =>
    `O ponto "${pointTitle}" recebeu uma doação de ${quantity}x ${productName}.`,
  DONATION_CANCELED_TITLE: 'Doação Cancelada',
  DONATION_CANCELED_MESSAGE: (pointTitle: string) =>
    `Uma doação no ponto ${pointTitle} foi cancelada.`,
  DONATION_DELIVERED_TITLE: 'Doação Entregue!',
  DONATION_DELIVERED_MESSAGE: (pointTitle: string) =>
    `Sua doação no ponto ${pointTitle} foi confirmada com sucesso. Obrigado!`,

  HELP_NEEDED_TITLE: 'Precisamos da sua ajuda!',
  HELP_NEEDED_MESSAGE: (pointTitle: string, itemsText: string) =>
    `O ponto "${pointTitle}" está precisando de: ${itemsText}.`,
  GOAL_UPDATED_TITLE: 'Meta atualizada',
  GOAL_UPDATED_MESSAGE: (pointTitle: string) =>
    `As necessidades do ponto ${pointTitle} foram atualizadas.`,
  MORE_HELP_NEEDED_TITLE: 'Precisamos de mais ajuda!',
  MORE_HELP_NEEDED_MESSAGE: (pointTitle: string, productName: string) =>
    `O ponto ${pointTitle} aumentou a meta de ${productName}. Ainda precisamos de doações!`,
  ITEM_CORRECTION_TITLE: 'Correção de item',
  ITEM_CORRECTION_MESSAGE: (productName: string, pointTitle: string) =>
    `Houve uma correção na descrição do item ${productName} no ponto ${pointTitle}.`,
  ITEM_NO_LONGER_NEEDED_TITLE: 'Meta Atualizada',
  ITEM_NO_LONGER_NEEDED_MESSAGE: (pointTitle: string, productName: string) =>
    `O ponto "${pointTitle}" não precisa mais de doações de ${productName} no momento.`,
  USER_CANCELED_DONATION_TITLE: 'Doação Cancelada',
  USER_CANCELED_DONATION_MESSAGE: (
    donorName: string,
    quantity: number,
    productName: string,
  ) => `${donorName} cancelou a doação de ${quantity}x ${productName}.`,
  DELIVERY_CONFIRMED_TITLE: 'Entrega Confirmada!',
  DELIVERY_CONFIRMED_MESSAGE: (productName: string, pointTitle: string) =>
    `Sua doação de ${productName} foi recebida pelo ponto "${pointTitle}". Muito obrigado!`,
};
