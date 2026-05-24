
-- Enum status
DO $$ BEGIN
  CREATE TYPE public.operation_status AS ENUM ('PENDING_PAYMENT','ACTIVE','SETTLED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_code text NOT NULL,
  amount numeric(18,2) NOT NULL DEFAULT 0,
  fee_amount numeric(18,2) NOT NULL DEFAULT 0,
  total_amount numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  incoterm text,
  release_trigger text,
  exporter_name text,
  importer_name text,
  bank_name text,
  swift text,
  iban text,
  beneficiary_country text,
  beneficiary_city text,
  invoice_number text,
  bl_awb text,
  duimp text,
  siscomex_reference text,
  payment_proof_url text,
  status public.operation_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz
);

CREATE INDEX IF NOT EXISTS operations_user_id_idx ON public.operations(user_id);
CREATE INDEX IF NOT EXISTS operations_status_idx ON public.operations(status);

ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own operations" ON public.operations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own operations" ON public.operations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own operations" ON public.operations
  FOR UPDATE USING (auth.uid() = user_id);

-- updated_at trigger uses existing public.set_updated_at()
CREATE TRIGGER operations_set_updated_at
BEFORE UPDATE ON public.operations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for payment proofs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users read own proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own proofs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
