export function serializeOrderItem(item) {
  return {
    id: item.id,
    item_id: item.itemId,
    name_en: item.nameEn,
    name_fr: item.nameFr,
    price: item.price,
    quantity: item.quantity,
    note: item.note
  };
}

export function serializeOrder(order) {
  return {
    id: order.id,
    display_number: order.displayNumber,
    table_number: order.table?.number ?? null,
    session_token: order.session?.token ?? null,
    session_status: order.session?.status ?? null,
    status: order.status,
    estimated_minutes: order.estimatedMinutes,
    items: order.items?.map(serializeOrderItem) ?? [],
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    viewed_at: order.viewedAt,
    preparing_at: order.preparingAt,
    ready_at: order.readyAt,
    completed_at: order.completedAt,
    cancelled_at: order.cancelledAt,
    called_at: order.calledAt
  };
}

export function serializeTabReceipt(session, orders) {
  return {
    table_number: session.table?.number ?? null,
    session_token: session.token,
    closed_at: session.closedAt,
    orders: orders.map(serializeOrder)
  };
}
