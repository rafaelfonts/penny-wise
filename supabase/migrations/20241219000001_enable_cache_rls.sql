-- =============================================================================
-- MIGRAÇÃO: HABILITAR RLS NAS TABELAS DE CACHE
-- =============================================================================
-- Data: 19/12/2024
-- Descrição: Habilitar Row Level Security nas tabelas market_cache e sentiment_cache
-- Resolução de: Alertas de segurança do Supabase Database Linter
-- Referência: rls_disabled_in_public errors

-- =============================================================================
-- HABILITAR RLS
-- =============================================================================

-- Habilitar RLS para market_cache
ALTER TABLE public.market_cache ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para sentiment_cache
ALTER TABLE public.sentiment_cache ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLÍTICAS DE SEGURANÇA PARA MARKET_CACHE
-- =============================================================================

-- Política de leitura: usuários autenticados podem ler cache de mercado
CREATE POLICY "cache_read_policy" ON public.market_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção: usuários autenticados podem inserir
CREATE POLICY "cache_insert_policy" ON public.market_cache
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização: usuários autenticados podem atualizar
CREATE POLICY "cache_update_policy" ON public.market_cache
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política de deleção: usuários autenticados podem deletar
CREATE POLICY "cache_delete_policy" ON public.market_cache
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- POLÍTICAS DE SEGURANÇA PARA SENTIMENT_CACHE
-- =============================================================================

-- Política de leitura: usuários autenticados podem ler cache de sentimento
CREATE POLICY "sentiment_read_policy" ON public.sentiment_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção: usuários autenticados podem inserir
CREATE POLICY "sentiment_insert_policy" ON public.sentiment_cache
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização: usuários autenticados podem atualizar
CREATE POLICY "sentiment_update_policy" ON public.sentiment_cache
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política de deleção: usuários autenticados podem deletar
CREATE POLICY "sentiment_delete_policy" ON public.sentiment_cache
    FOR DELETE USING (auth.role() = 'authenticated'); 