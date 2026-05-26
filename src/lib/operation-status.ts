export const OPERATION_STATUS = {
  CREATED: "CREATED",
  EXPORTER_ACCEPTED: "EXPORTER_ACCEPTED",
  CARGO_SHIPPED: "CARGO_SHIPPED",
  IN_TRANSIT: "IN_TRANSIT",
  CUSTOMS_ARRIVAL: "CUSTOMS_ARRIVAL",
  CUSTOMS_RELEASED: "CUSTOMS_RELEASED",
} as const;

export const TIMELINE_STEPS = {
  OPERATION_CREATED: "operation_created",
  PAYMENT_PENDING: "payment_pending",
  RECEIPT_RECEIVED: "receipt_received",
  PAYMENT_VALIDATED: "payment_validated",
  OPERATION_MONITORING: "operation_monitoring",
  SETTLEMENT_STARTED: "settlement_started",
  SETTLEMENT_CONFIRMED: "settlement_confirmed",
  OPERATION_COMPLETED: "operation_completed",
} as const;

export function isSettlementCompleted(settlement: any) {
  return settlement?.status === "CONFIRMED";
}

export function hasSettlementStarted(settlement: any) {
  return !!settlement;
}

export function isMonitoringCompleted(
  currentOperationalStatus?: string,
  releaseTrigger?: string,
) {
  return (
    !!currentOperationalStatus &&
    !!releaseTrigger &&
    currentOperationalStatus === releaseTrigger
  );
}