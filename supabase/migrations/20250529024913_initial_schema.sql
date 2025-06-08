-- =============================================================================
-- PENNY WISE - INITIAL SCHEMA
-- =============================================================================
-- Criado em: 29/05/2024
-- Descrição: Schema inicial para a plataforma de análise financeira com IA

-- =============================================================================
-- EXTENSÕES NECESSÁRIAS
-- =============================================================================
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABELA: PROFILES
-- =============================================================================
-- Estende auth.users com informações adicionais do usuário
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABELA: CONVERSATIONS
-- =============================================================================
-- Conversas do chat com IA
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABELA: MESSAGES
-- =============================================================================
-- Mensagens das conversas
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABELA: WATCHLIST
-- =============================================================================
-- Lista de ações/ativos acompanhados pelo usuário
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT,
  market TEXT DEFAULT 'BR', -- BR, US, etc.
  alerts JSONB DEFAULT '{}',
  notes TEXT,
  position INTEGER, -- Para ordenação personalizada
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol, market)
);

-- =============================================================================
-- TABELA: MARKET_CACHE
-- =============================================================================
-- Cache de dados de mercado para otimizar performance
CREATE TABLE market_cache (
  symbol TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'BR',
  data_type TEXT NOT NULL, -- 'quote', 'historical', 'options', etc.
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (symbol, market, data_type)
);

-- =============================================================================
-- TABELA: SAVED_ANALYSIS
-- =============================================================================
-- Análises salvas pelo usuário
CREATE TABLE saved_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  symbol TEXT,
  market TEXT DEFAULT 'BR',
  analysis_type TEXT NOT NULL, -- 'sentiment', 'technical', 'fundamental', etc.
  data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABELA: SENTIMENT_CACHE
-- =============================================================================
-- Cache de análises de sentimento para otimizar FinBERT
CREATE TABLE sentiment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_hash TEXT UNIQUE NOT NULL, -- Hash do texto analisado
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  score NUMERIC(5,4) NOT NULL, -- Score de 0.0000 a 1.0000
  confidence NUMERIC(5,4) NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'finbert',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABELA: USER_ALERTS
-- =============================================================================
-- Sistema de alertas personalizados
CREATE TABLE user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  market TEXT DEFAULT 'BR',
  alert_type TEXT NOT NULL, -- 'price', 'volume', 'sentiment', etc.
  condition_type TEXT NOT NULL, -- 'above', 'below', 'change_percent', etc.
  target_value NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices para conversations
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Índices para messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Índices para watchlist
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_symbol ON watchlist(symbol);

-- Índices para market_cache
CREATE INDEX idx_market_cache_expires_at ON market_cache(expires_at);
CREATE INDEX idx_market_cache_symbol_market ON market_cache(symbol, market);

-- Índices para saved_analysis
CREATE INDEX idx_saved_analysis_user_id ON saved_analysis(user_id);
CREATE INDEX idx_saved_analysis_symbol ON saved_analysis(symbol);
CREATE INDEX idx_saved_analysis_created_at ON saved_analysis(created_at DESC);

-- Índices para sentiment_cache
CREATE INDEX idx_sentiment_cache_text_hash ON sentiment_cache(text_hash);
CREATE INDEX idx_sentiment_cache_expires_at ON sentiment_cache(expires_at);

-- Índices para user_alerts
CREATE INDEX idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX idx_user_alerts_symbol ON user_alerts(symbol);
CREATE INDEX idx_user_alerts_is_active ON user_alerts(is_active);

-- =============================================================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON watchlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_cache_updated_at BEFORE UPDATE ON market_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_analysis_updated_at BEFORE UPDATE ON saved_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_alerts_updated_at BEFORE UPDATE ON user_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Users can view messages from own conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in own conversations" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- Políticas para watchlist
CREATE POLICY "Users can manage own watchlist" ON watchlist
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para saved_analysis
CREATE POLICY "Users can view own analysis" ON saved_analysis
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can manage own analysis" ON saved_analysis
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_alerts
CREATE POLICY "Users can manage own alerts" ON user_alerts
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM market_cache WHERE expires_at < NOW();
    DELETE FROM sentiment_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON TABLE profiles IS 'Perfis de usuário estendidos com preferências e configurações';
COMMENT ON TABLE conversations IS 'Conversas do chat com IA, organizadas por usuário';
COMMENT ON TABLE messages IS 'Mensagens individuais das conversas, incluindo metadados de IA';
COMMENT ON TABLE watchlist IS 'Lista de ativos acompanhados pelos usuários';
COMMENT ON TABLE market_cache IS 'Cache de dados de mercado para otimizar performance';
COMMENT ON TABLE saved_analysis IS 'Análises salvas pelos usuários, podem ser públicas ou privadas';
COMMENT ON TABLE sentiment_cache IS 'Cache de análises de sentimento do FinBERT';
COMMENT ON TABLE user_alerts IS 'Sistema de alertas personalizados por usuário';

-- =============================================================================
-- DADOS INICIAIS (SEED)
-- =============================================================================

-- Inserir alguns dados de exemplo para desenvolvimento
-- (Remover em produção)

-- Exemplo de dados de cache de mercado (PETR4)
INSERT INTO market_cache (symbol, market, data_type, data, expires_at) VALUES
('PETR4', 'BR', 'quote', '{"price": 32.45, "change": 0.85, "change_percent": 2.69, "volume": 15420000}', NOW() + INTERVAL '1 hour');

-- Exemplo de análise de sentimento
INSERT INTO sentiment_cache (text_hash, sentiment, score, confidence, model_used, language) VALUES
('hash_example_1', 'positive', 0.8542, 0.9123, 'finbert-pt-br', 'pt-BR');

-- =============================================================================
-- FIM DO SCHEMA INICIAL
-- =============================================================================
