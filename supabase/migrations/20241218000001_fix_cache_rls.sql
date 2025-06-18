-- =============================================================================
-- MIGRAÇÃO: CORRIGIR RLS PARA TABELAS DE CACHE
-- =============================================================================
-- Data: 18/12/2024
-- Descrição: Habilitar Row Level Security nas tabelas market_cache e sentiment_cache
-- Motivo: Resolver alertas de segurança do Supabase Database Linter

-- =============================================================================
-- HABILITAR RLS NAS TABELAS DE CACHE
-- =============================================================================

-- Habilitar RLS para market_cache
ALTER TABLE market_cache ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para sentiment_cache  
ALTER TABLE sentiment_cache ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLÍTICAS DE SEGURANÇA PARA MARKET_CACHE
-- =============================================================================
-- Como market_cache contém dados públicos de mercado, permite leitura geral
-- mas restringe operações de escrita para usuários autenticados

-- Política de leitura: qualquer usuário autenticado pode ler cache de mercado
CREATE POLICY "Allow authenticated users to read market cache" ON market_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção: apenas usuários autenticados podem inserir
CREATE POLICY "Allow authenticated users to insert market cache" ON market_cache
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização: apenas usuários autenticados podem atualizar
CREATE POLICY "Allow authenticated users to update market cache" ON market_cache
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política de deleção: apenas usuários autenticados podem deletar
CREATE POLICY "Allow authenticated users to delete market cache" ON market_cache
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- POLÍTICAS DE SEGURANÇA PARA SENTIMENT_CACHE
-- =============================================================================
-- Como sentiment_cache contém análises de sentimento reutilizáveis,
-- permite leitura geral mas restringe operações de escrita

-- Política de leitura: qualquer usuário autenticado pode ler cache de sentimento
CREATE POLICY "Allow authenticated users to read sentiment cache" ON sentiment_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção: apenas usuários autenticados podem inserir
CREATE POLICY "Allow authenticated users to insert sentiment cache" ON sentiment_cache
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização: apenas usuários autenticados podem atualizar
CREATE POLICY "Allow authenticated users to update sentiment cache" ON sentiment_cache
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política de deleção: apenas usuários autenticados podem deletar
CREATE POLICY "Allow authenticated users to delete sentiment cache" ON sentiment_cache
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON POLICY "Allow authenticated users to read market cache" ON market_cache 
IS 'Permite que usuários autenticados leiam dados do cache de mercado (dados públicos)';

COMMENT ON POLICY "Allow authenticated users to insert market cache" ON market_cache 
IS 'Permite que usuários autenticados insiram dados no cache de mercado';

COMMENT ON POLICY "Allow authenticated users to update market cache" ON market_cache 
IS 'Permite que usuários autenticados atualizem dados do cache de mercado';

COMMENT ON POLICY "Allow authenticated users to delete market cache" ON market_cache 
IS 'Permite que usuários autenticados deletem dados expirados do cache de mercado';

COMMENT ON POLICY "Allow authenticated users to read sentiment cache" ON sentiment_cache 
IS 'Permite que usuários autenticados leiam análises de sentimento em cache';

COMMENT ON POLICY "Allow authenticated users to insert sentiment cache" ON sentiment_cache 
IS 'Permite que usuários autenticados insiram análises de sentimento no cache';

COMMENT ON POLICY "Allow authenticated users to update sentiment cache" ON sentiment_cache 
IS 'Permite que usuários autenticados atualizem análises de sentimento no cache';

COMMENT ON POLICY "Allow authenticated users to delete sentiment cache" ON sentiment_cache 
IS 'Permite que usuários autenticados deletem análises expiradas do cache de sentimento';

-- =============================================================================
-- VALIDAÇÃO DA CONFIGURAÇÃO RLS
-- =============================================================================

-- Verificar se RLS está habilitado (deve retornar true para ambas as tabelas)
DO $$
BEGIN
    -- Verificar market_cache
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
        AND c.relname = 'market_cache' 
        AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS não foi habilitado corretamente para market_cache';
    END IF;

    -- Verificar sentiment_cache
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
        AND c.relname = 'sentiment_cache' 
        AND c.relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS não foi habilitado corretamente para sentiment_cache';
    END IF;

    RAISE NOTICE 'RLS habilitado com sucesso para market_cache e sentiment_cache';
END $$; 