-- Issue #30
-- Proteção das chaves Stellar e isolamento de dados por usuário.

-- =========================================================
-- OPERATIONS
-- =========================================================

alter table public.operations enable row level security;

drop policy if exists "Users view own operations"
on public.operations;

drop policy if exists "Users insert own operations"
on public.operations;

drop policy if exists "Users update own operations"
on public.operations;

drop policy if exists "Users can view own operations"
on public.operations;

drop policy if exists "Users can create own operations"
on public.operations;

drop policy if exists "Users can update own operations"
on public.operations;

drop policy if exists "Usuários podem visualizar as próprias operações"
on public.operations;

drop policy if exists "Usuários podem criar as próprias operações"
on public.operations;

drop policy if exists "Usuários podem atualizar as próprias operações"
on public.operations;

create policy "Usuários podem visualizar as próprias operações"
on public.operations
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "Usuários podem criar as próprias operações"
on public.operations
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "Usuários podem atualizar as próprias operações"
on public.operations
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

-- Intencionalmente não existe policy de DELETE.


-- =========================================================
-- SETTLEMENTS
-- =========================================================

alter table public.settlements enable row level security;

drop policy if exists "Users view own settlements"
on public.settlements;

drop policy if exists "Users insert own settlements"
on public.settlements;

drop policy if exists "Usuários podem visualizar os próprios settlements"
on public.settlements;

drop policy if exists "Usuários podem criar os próprios settlements"
on public.settlements;

create policy "Usuários podem visualizar os próprios settlements"
on public.settlements
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "Usuários podem criar os próprios settlements"
on public.settlements
for insert
to authenticated
with check (
  auth.uid() = user_id
);

-- Intencionalmente não existem policies de UPDATE ou DELETE.


-- =========================================================
-- PLATFORM_ASSETS
-- =========================================================

alter table public.platform_assets enable row level security;

-- Nenhuma policy pública deve ser criada para platform_assets.
-- O acesso ocorre exclusivamente no servidor com service_role,
-- pois a tabela contém issuer_secret.