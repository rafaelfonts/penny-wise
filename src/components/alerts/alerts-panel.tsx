'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCard } from './alert-card'
import { CreateAlertDialog } from './create-alert-dialog'
import { AlertStats } from './alert-stats'
import { 
  Bell, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { useAlerts } from '@/hooks/use-alerts'
import type { Alert, CreateAlert } from '@/lib/types/alerts'

interface AlertsPanelProps {
  className?: string
}

export function AlertsPanel({ className }: AlertsPanelProps) {
  const {
    alerts,
    loading,
    error,
    createAlert,
    deleteAlert,
    toggleAlert,
    refreshAlerts,
    getActiveAlerts,
    getTriggeredAlerts
  } = useAlerts()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'triggered'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAlerts()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreateAlert = async (alertData: CreateAlert) => {
    try {
      const result = await createAlert(alertData)
      if (result) {
        setShowCreateDialog(false)
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating alert:', error)
      return false
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteAlert(alertId)
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  const handleToggleAlert = async (alertId: string) => {
    try {
      await toggleAlert(alertId)
    } catch (error) {
      console.error('Error toggling alert:', error)
    }
  }

  // Filter alerts based on search and active tab
  const getFilteredAlerts = () => {
    let filteredAlerts: Alert[] = []
    
    switch (activeTab) {
      case 'active':
        filteredAlerts = getActiveAlerts()
        break
      case 'triggered':
        filteredAlerts = getTriggeredAlerts()
        break
      default:
        filteredAlerts = alerts
    }

    if (searchTerm) {
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filteredAlerts
  }

  const filteredAlerts = getFilteredAlerts()
  const activeAlertsCount = getActiveAlerts().length
  const triggeredAlertsCount = getTriggeredAlerts().length

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alertas de Mercado</h1>
          <p className="text-muted-foreground">
            Gerencie seus alertas de preços e volume
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Alerta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <AlertStats 
        stats={{
          total: alerts.length,
          active: activeAlertsCount,
          triggered_today: triggeredAlertsCount,
          triggered_this_week: triggeredAlertsCount,
          by_type: { price: 0, volume: 0, technical: 0, news: 0 },
          by_symbol: {}
        }}
      />

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por símbolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Erro: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'active' | 'triggered')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Todos ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ativos ({activeAlertsCount})
          </TabsTrigger>
          <TabsTrigger value="triggered" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Disparados ({triggeredAlertsCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca'
                    : 'Crie seu primeiro alerta para monitorar o mercado'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Alerta
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDelete={handleDeleteAlert}
                  onToggle={handleToggleAlert}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum alerta ativo</h3>
                <p className="text-muted-foreground mb-4">
                  Crie alertas para monitorar preços e volumes em tempo real
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Alerta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDelete={handleDeleteAlert}
                  onToggle={handleToggleAlert}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="triggered" className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum alerta disparado</h3>
                <p className="text-muted-foreground">
                  Os alertas disparados aparecerão aqui quando as condições forem atendidas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDelete={handleDeleteAlert}
                  onToggle={handleToggleAlert}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Alert Dialog */}
      <CreateAlertDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateAlert={handleCreateAlert}
      />
    </div>
  )
} 