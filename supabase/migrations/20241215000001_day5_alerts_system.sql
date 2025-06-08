-- ==========================================
-- DAY 5 MIGRATION: ALERTS & DASHBOARD SYSTEM
-- ==========================================

-- Alertas do usuário
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  alert_type text CHECK (alert_type IN ('price', 'volume', 'technical', 'news')) NOT NULL,
  condition_type text CHECK (condition_type IN ('above', 'below', 'cross_above', 'cross_below', 'change_percent')) NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric,
  is_active boolean DEFAULT true,
  triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  cooldown_minutes integer DEFAULT 60,
  last_triggered timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('alert', 'news', 'system', 'market', 'portfolio')) NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Configurações de dashboard
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  layout_name text NOT NULL,
  widgets jsonb NOT NULL,
  grid_config jsonb DEFAULT '{}',
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, layout_name)
);

-- Arquivos exportados
CREATE TABLE IF NOT EXISTS exported_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text CHECK (file_type IN ('png', 'svg', 'csv', 'json', 'pdf')) NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  content_type text,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  download_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Configurações de notificação do usuário
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  alert_notifications boolean DEFAULT true,
  market_notifications boolean DEFAULT true,
  news_notifications boolean DEFAULT false,
  system_notifications boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para tabela alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Índices para tabela notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Índices para tabela dashboard_layouts
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_default ON dashboard_layouts(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_active ON dashboard_layouts(is_active) WHERE is_active = true;

-- Índices para tabela exported_files
CREATE INDEX IF NOT EXISTS idx_exported_files_user_id ON exported_files(user_id);
CREATE INDEX IF NOT EXISTS idx_exported_files_expires_at ON exported_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_exported_files_created_at ON exported_files(created_at);

-- ==========================================
-- TRIGGERS PARA UPDATED_AT
-- ==========================================

-- Trigger para alerts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at BEFORE UPDATE ON dashboard_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exported_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para alerts
CREATE POLICY "Users can view their own alerts" ON alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts" ON alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para dashboard_layouts
CREATE POLICY "Users can view their own dashboard layouts" ON dashboard_layouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard layouts" ON dashboard_layouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard layouts" ON dashboard_layouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard layouts" ON dashboard_layouts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para exported_files
CREATE POLICY "Users can view their own exported files" ON exported_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exported files" ON exported_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exported files" ON exported_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exported files" ON exported_files
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- FUNÇÕES AUXILIARES
-- ==========================================

-- Função para verificar alertas ativos
CREATE OR REPLACE FUNCTION check_price_alerts(
    symbol_param text,
    current_price numeric
)
RETURNS TABLE(alert_id uuid, user_id uuid, alert_type text, condition_type text, target_value numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.alert_type,
        a.condition_type,
        a.target_value
    FROM alerts a
    WHERE a.symbol = symbol_param
        AND a.is_active = true
        AND a.alert_type = 'price'
        AND (
            (a.condition_type = 'above' AND current_price >= a.target_value)
            OR (a.condition_type = 'below' AND current_price <= a.target_value)
        )
        AND (
            a.last_triggered IS NULL 
            OR a.last_triggered < (now() - (a.cooldown_minutes || ' minutes')::interval)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar alerta como ativado
CREATE OR REPLACE FUNCTION trigger_alert(alert_id_param uuid, current_price numeric)
RETURNS void AS $$
BEGIN
    UPDATE alerts
    SET 
        triggered_at = now(),
        last_triggered = now(),
        current_value = current_price,
        trigger_count = trigger_count + 1
    WHERE id = alert_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar notificações expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar arquivos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM exported_files 
    WHERE expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar layout padrão do dashboard
CREATE OR REPLACE FUNCTION create_default_dashboard_layout(user_id_param uuid)
RETURNS uuid AS $$
DECLARE
    layout_id uuid;
    default_widgets jsonb;
BEGIN
    default_widgets := '[
        {"id": "portfolio-overview", "type": "portfolio", "x": 0, "y": 0, "w": 6, "h": 3},
        {"id": "market-overview", "type": "market", "x": 6, "y": 0, "w": 6, "h": 3},
        {"id": "watchlist", "type": "watchlist", "x": 0, "y": 3, "w": 8, "h": 4},
        {"id": "alerts", "type": "alerts", "x": 8, "y": 3, "w": 4, "h": 4},
        {"id": "news", "type": "news", "x": 0, "y": 7, "w": 12, "h": 3}
    ]'::jsonb;

    INSERT INTO dashboard_layouts (user_id, layout_name, widgets, is_default)
    VALUES (user_id_param, 'Default Layout', default_widgets, true)
    RETURNING id INTO layout_id;

    RETURN layout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

COMMENT ON TABLE alerts IS 'Sistema de alertas do usuário para preços, volume e indicadores técnicos';
COMMENT ON TABLE notifications IS 'Notificações enviadas aos usuários (push, email, in-app)';
COMMENT ON TABLE dashboard_layouts IS 'Layouts personalizados do dashboard com widgets configuráveis';
COMMENT ON TABLE exported_files IS 'Arquivos exportados pelo usuário (charts, dados, relatórios)';
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação do usuário';

COMMENT ON COLUMN alerts.cooldown_minutes IS 'Tempo em minutos entre triggers do mesmo alerta para evitar spam';
COMMENT ON COLUMN alerts.trigger_count IS 'Contador de quantas vezes o alerta foi ativado';
COMMENT ON COLUMN notifications.priority IS 'Prioridade da notificação afeta ordenação e estilo';
COMMENT ON COLUMN exported_files.expires_at IS 'Data de expiração do arquivo para limpeza automática';
COMMENT ON COLUMN dashboard_layouts.grid_config IS 'Configurações específicas do grid layout (breakpoints, margins, etc)'; 