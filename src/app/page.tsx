import {
  H1,
  H2,
  H3,
  BodyText,
  Label,
  Caption,
} from '@/components/ui/typography';
import { Icon } from '@/components/ui/icon';
import { CONTEXT_ICONS } from '@/lib/icons/context-icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <main className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <H1 className="text-primary">Penny Wise</H1>
          <BodyText size="large" className="text-muted-foreground">
            Plataforma de análise financeira com IA
          </BodyText>
        </div>

        {/* Typography Demo */}
        <Card>
          <CardHeader>
            <CardTitle>
              <H2>Sistema de Tipografia</H2>
            </CardTitle>
            <CardDescription>
              Demonstração das fontes Outfit e Inter Light
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <H1>Heading 1 - Outfit Medium</H1>
              <H2>Heading 2 - Outfit Medium</H2>
              <H3>Heading 3 - Outfit Regular</H3>
            </div>
            <div>
              <BodyText size="large">Body Large - Inter Light</BodyText>
              <BodyText>Body Normal - Inter Light</BodyText>
              <BodyText size="small">Body Small - Inter Light</BodyText>
              <Label>Label - Inter Medium</Label>
              <Caption>Caption - Inter Regular</Caption>
            </div>
          </CardContent>
        </Card>

        {/* Icons Demo */}
        <Card>
          <CardHeader>
            <CardTitle>
              <H2>Sistema de Ícones</H2>
            </CardTitle>
            <CardDescription>
              Ícones Lucide + Tabler com contexto financeiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <Icon
                  icon={CONTEXT_ICONS.market.bullish}
                  className="text-green-600"
                />
                <Label>Alta</Label>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon={CONTEXT_ICONS.market.bearish}
                  className="text-red-600"
                />
                <Label>Baixa</Label>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon={CONTEXT_ICONS.sentiment.positive}
                  className="text-green-600"
                />
                <Label>Positivo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon={CONTEXT_ICONS.navigation.chat}
                  className="text-blue-600"
                />
                <Label>Chat</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons Demo */}
        <Card>
          <CardHeader>
            <CardTitle>
              <H2>Botões Arredondados</H2>
            </CardTitle>
            <CardDescription>
              Todos os botões seguem o padrão arredondado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Pequeno</Button>
              <Button>Padrão</Button>
              <Button size="lg">Grande</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secundário</Button>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Icon icon={CONTEXT_ICONS.status.success} />
            <BodyText>Design System configurado com sucesso!</BodyText>
          </div>
        </div>
      </div>
    </main>
  );
}
