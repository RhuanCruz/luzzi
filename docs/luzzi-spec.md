# Luzzi Analytics - Especificação MVP

Documento de especificação para implementação do Luzzi, uma ferramenta de analytics plug-and-play para solo builders.

---

## Visão Geral

**Objetivo**: Criar uma solução de analytics com zero configuração de dashboards. O usuário só implementa o SDK no código e os gráficos aparecem automaticamente.

**Stack**:
- Monorepo: Turborepo
- SDK: TypeScript (publicar no npm como `@luzzi/analytics`)
- API: Vercel Edge Functions
- Database: Supabase (Postgres)
- Auth: Clerk
- Dashboard: Next.js 14 + Tailwind + Recharts

---

## Estrutura do Monorepo

```
luzzi/
├── apps/
│   ├── api/                 # Vercel Edge Functions
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── events.ts      # POST /v1/events
│   │       │   └── projects.ts    # CRUD projetos
│   │       └── lib/
│   │           ├── db.ts          # Supabase client
│   │           └── auth.ts        # API key validation
│   │
│   └── dashboard/           # Next.js 14
│       └── app/
│           ├── (auth)/            # Login/signup (Clerk)
│           ├── (dashboard)/
│           │   ├── page.tsx       # Overview com métricas
│           │   ├── events/        # Lista de eventos
│           │   └── settings/      # API keys
│           └── layout.tsx
│
├── packages/
│   └── sdk/                 # @luzzi/analytics
│       └── src/
│           ├── index.ts           # Entry point
│           ├── core.ts            # Lógica principal
│           ├── queue.ts           # Batch de eventos
│           └── types.ts
│
├── package.json             # Turborepo
└── turbo.json
```

---

## 1. SDK (`@luzzi/analytics`)

### API Pública

```typescript
import luzzi from "@luzzi/analytics";

// Inicialização (obrigatório)
luzzi.init("pk_live_xxx");

// Tracking de eventos
luzzi.track("event_name");
luzzi.track("event_name", { property: "value" });

// Identificar usuário (opcional)
luzzi.identify("user_123", { plan: "pro" });

// Reset (logout)
luzzi.reset();
```

### Implementação Interna

- Gerar `session_id` único por sessão
- Coletar device info automaticamente (OS, app version via User-Agent)
- Batch de eventos (enviar a cada 10 eventos ou 30 segundos)
- Persistir eventos offline e enviar quando online (opcional v2)
- Enviar para `POST https://api.luzzi.dev/v1/events`

### Headers da Request

```
POST /v1/events
x-api-key: pk_live_xxx
Content-Type: application/json

{
  "events": [
    {
      "event": "clicked_signup",
      "properties": { "source": "homepage" },
      "timestamp": "2026-01-03T15:00:00Z",
      "session_id": "abc123",
      "user_id": "user_123",           // se identify() foi chamado
      "device": {
        "os": "ios",
        "app_version": "1.0.0"
      }
    }
  ]
}
```

---

## 2. API (Vercel Edge Functions)

### Endpoints

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/v1/events` | Receber eventos do SDK | API Key |
| GET | `/v1/projects` | Listar projetos do usuário | Clerk JWT |
| POST | `/v1/projects` | Criar projeto | Clerk JWT |
| GET | `/v1/projects/:id` | Detalhes do projeto | Clerk JWT |
| POST | `/v1/projects/:id/keys` | Regenerar API keys | Clerk JWT |
| GET | `/v1/analytics/overview` | Dados para dashboard | Clerk JWT |
| GET | `/v1/analytics/events` | Lista de eventos | Clerk JWT |
| GET | `/v1/analytics/funnel` | Dados de funil | Clerk JWT |

### Validação de API Key

```typescript
// Middleware
async function validateApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  
  if (!apiKey) {
    return { error: "Missing API key", status: 401 };
  }
  
  const project = await db.projects.findByApiKey(apiKey);
  
  if (!project) {
    return { error: "Invalid API key", status: 401 };
  }
  
  if (project.events_count >= project.events_limit) {
    return { error: "Event limit reached. Upgrade your plan.", status: 429 };
  }
  
  return { project };
}
```

---

## 3. Database Schema (Supabase)

```sql
-- Usuários (gerenciado pelo Clerk, só referência)
-- Não criar tabela, usar user_id do Clerk

-- Projetos/Apps
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL,              -- Clerk user ID
  api_key_live TEXT UNIQUE NOT NULL,  -- pk_live_xxx
  api_key_test TEXT UNIQUE NOT NULL,  -- pk_test_xxx
  plan TEXT DEFAULT 'free',           -- free, pro, enterprise
  events_limit INT DEFAULT 10000,     -- limite mensal
  events_count INT DEFAULT 0,         -- contador do mês atual
  events_reset_at TIMESTAMPTZ,        -- quando resetar contador
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eventos
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  user_id TEXT,                       -- ID do usuário do app cliente
  device JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_events_project_time ON events(project_id, timestamp DESC);
CREATE INDEX idx_events_name ON events(project_id, event_name);
CREATE INDEX idx_events_session ON events(project_id, session_id);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_api_key ON projects(api_key_live);
```

### Função para gerar API keys

```sql
CREATE OR REPLACE FUNCTION generate_api_key(prefix TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN prefix || '_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT generate_api_key('pk_live');
-- Resultado: pk_live_a1b2c3d4e5f6...
```

---

## 4. Dashboard (Next.js)

### Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Redirect para `/dashboard` ou `/sign-in` |
| `/sign-in` | Login (Clerk) |
| `/sign-up` | Cadastro (Clerk) |
| `/dashboard` | Overview com as 5 métricas |
| `/dashboard/events` | Lista de todos os eventos |
| `/dashboard/settings` | API keys + configurações |

### 5 Métricas do MVP (Dashboard Overview)

#### 1. Daily Active Users (DAU)
- Line chart dos últimos 30 dias
- Contagem de `session_id` únicos por dia

```sql
SELECT DATE(timestamp) as day, COUNT(DISTINCT session_id) as dau
FROM events
WHERE project_id = $1 AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY day;
```

#### 2. Eventos por Dia
- Bar chart dos últimos 7 dias
- Contagem total de eventos

```sql
SELECT DATE(timestamp) as day, COUNT(*) as total
FROM events
WHERE project_id = $1 AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY day;
```

#### 3. Top 10 Eventos
- Lista rankeada
- Contagem por event_name

```sql
SELECT event_name, COUNT(*) as total
FROM events
WHERE project_id = $1 AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY event_name
ORDER BY total DESC
LIMIT 10;
```

#### 4. Funil Automático
- Detectar eventos com padrões sequenciais
- Ex: `onboarding_step_1`, `onboarding_step_2`, `onboarding_step_3`
- Ou eventos com mesmo prefixo: `paywall_viewed`, `paywall_started`, `paywall_completed`

```sql
-- Exemplo para funil de onboarding
WITH funnel AS (
  SELECT 
    event_name,
    COUNT(DISTINCT session_id) as users
  FROM events
  WHERE project_id = $1 
    AND event_name LIKE 'onboarding_%'
    AND timestamp > NOW() - INTERVAL '30 days'
  GROUP BY event_name
)
SELECT * FROM funnel ORDER BY event_name;
```

#### 5. Live Feed
- Últimos 50 eventos em tempo real
- Polling a cada 5 segundos ou WebSocket (v2)

```sql
SELECT event_name, properties, timestamp, device
FROM events
WHERE project_id = $1
ORDER BY timestamp DESC
LIMIT 50;
```

### UI/UX do Dashboard

- **Tema**: Dark mode por padrão (combina com a LP)
- **Charts**: Usar Recharts ou Tremor
- **Layout**: Sidebar com navegação, conteúdo principal com grid de cards
- **Zero config**: Todos os gráficos aparecem automaticamente, sem configuração

---

## 5. Fases de Implementação

### Fase 1: Setup (1h)
- [ ] Criar repo no GitHub
- [ ] Setup Turborepo
- [ ] Configurar TypeScript
- [ ] Setup Supabase (criar projeto + rodar migrations)
- [ ] Setup Vercel (conectar repo)

### Fase 2: SDK (2-3h)
- [ ] Implementar `init()`, `track()`, `identify()`, `reset()`
- [ ] Gerar session_id
- [ ] Coletar device info
- [ ] Implementar batch queue
- [ ] Build + publicar no npm

### Fase 3: API (2-3h)
- [ ] Endpoint `POST /v1/events`
- [ ] Validação de API key
- [ ] Rate limiting por plano
- [ ] Endpoints CRUD de projetos
- [ ] Endpoints de analytics (overview, events, funnel)

### Fase 4: Dashboard (6-8h)
- [ ] Setup Next.js + Clerk
- [ ] Layout base (sidebar, header)
- [ ] Página de criar/listar projetos
- [ ] Página de API keys
- [ ] Dashboard overview com 5 métricas
- [ ] Página de lista de eventos
- [ ] Live feed

### Fase 5: Dogfooding (1-2h)
- [ ] Instalar `@luzzi/analytics` no Zemly
- [ ] Adicionar eventos de onboarding
- [ ] Adicionar eventos de paywall
- [ ] Adicionar eventos de features

---

## Considerações Técnicas

### Performance
- Usar Edge Functions para baixa latência global
- Batch inserts no Supabase
- Índices otimizados para queries comuns

### Segurança
- API keys nunca expostas no frontend do dashboard
- Validar origem das requests (CORS)
- Sanitizar properties antes de salvar

### Escalabilidade (futuro)
- Migrar para Clickhouse se volume crescer muito
- Implementar particionamento por data
- CDN para assets estáticos

---

## Links Úteis

- Turborepo: https://turbo.build/repo
- Supabase: https://supabase.com
- Clerk: https://clerk.com
- Vercel: https://vercel.com
- Recharts: https://recharts.org
- Tremor: https://tremor.so
