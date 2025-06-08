-- =============================================================================
-- MIGRAÇÃO: SEPARAR NOME EM PRIMEIRO E ÚLTIMO NOME
-- =============================================================================
-- Data: 30/12/2024
-- Descrição: Separa o campo full_name em first_name e last_name na tabela profiles

-- Adicionar novas colunas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrar dados existentes (dividir full_name em first_name e last_name)
UPDATE profiles 
SET 
    first_name = CASE 
        WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
        THEN split_part(full_name, ' ', 1)
        ELSE full_name
    END,
    last_name = CASE 
        WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
        THEN substring(full_name FROM position(' ' in full_name) + 1)
        ELSE NULL
    END
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Atualizar a função handle_new_user para usar os novos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, full_name, avatar_url)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'first_name', 
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar índices para performance (opcional, se necessário)
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name);

-- Adicionar comentários para documentação
COMMENT ON COLUMN profiles.first_name IS 'Primeiro nome do usuário';
COMMENT ON COLUMN profiles.last_name IS 'Último nome do usuário';
COMMENT ON COLUMN profiles.full_name IS 'Nome completo (mantido para compatibilidade, será removido em versão futura)'; 