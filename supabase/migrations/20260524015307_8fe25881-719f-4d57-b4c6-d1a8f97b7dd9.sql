-- Rename amount -> protected_amount
ALTER TABLE public.operations RENAME COLUMN amount TO protected_amount;

-- Add COMPLETED to operation_status enum, remove SETTLED
-- Postgres can't drop enum values directly; recreate the enum.
ALTER TYPE public.operation_status RENAME TO operation_status_old;

CREATE TYPE public.operation_status AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

ALTER TABLE public.operations
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.operation_status
    USING (CASE WHEN status::text = 'SETTLED' THEN 'COMPLETED' ELSE status::text END)::public.operation_status,
  ALTER COLUMN status SET DEFAULT 'PENDING_PAYMENT'::public.operation_status;

DROP TYPE public.operation_status_old;