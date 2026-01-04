# Guia de Implementação - Luzzi Analytics

## Instalação

```bash
npm install luzzi-analytics
```

---

## Configuração Básica

### 1. Inicialização (uma vez na aplicação)

```typescript
import luzzi from "luzzi-analytics";

// Inicializar com sua API key (obter em luzzi.vercel.app/dashboard/keys)
luzzi.init("pk_live_sua_api_key_aqui");
```

**Onde colocar:**
- **React/Next.js**: No `_app.tsx` ou `layout.tsx` (client component)
- **React Native**: No `App.tsx` antes do render
- **Vue**: No `main.ts`
- **Vanilla JS**: No início do script principal

---

## Uso

### Rastrear Eventos

```typescript
// Evento simples
luzzi.track("button_clicked");

// Evento com propriedades
luzzi.track("purchase_completed", {
  product_id: "prod_123",
  price: 99.90,
  currency: "BRL"
});

// Evento de página
luzzi.track("page_view", { page: "/pricing" });
```

### Identificar Usuário

```typescript
// Após login do usuário
luzzi.identify("user_id_123", {
  email: "user@example.com",
  plan: "pro",
  name: "João Silva"
});
```

### Resetar Sessão (logout)

```typescript
// Após logout do usuário
luzzi.reset();
```

---

## Exemplos de Integração

### Next.js (App Router)

```typescript
// app/providers.tsx
"use client";

import { useEffect } from "react";
import luzzi from "luzzi-analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    luzzi.init("pk_live_xxx");
  }, []);

  return <>{children}</>;
}

// app/layout.tsx
import { AnalyticsProvider } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
```

### React Native / Expo

```typescript
// App.tsx
import { useEffect } from "react";
import luzzi from "luzzi-analytics";

export default function App() {
  useEffect(() => {
    luzzi.init("pk_live_xxx");
  }, []);

  // ... resto do app
}

// Componente de botão
function SignupButton() {
  const handlePress = () => {
    luzzi.track("signup_button_pressed");
    // ... lógica de signup
  };
  
  return <Button onPress={handlePress} title="Sign Up" />;
}
```

---

## Eventos Recomendados

| Evento | Quando usar | Propriedades sugeridas |
|--------|-------------|------------------------|
| `page_view` | Navegação entre telas | `page`, `referrer` |
| `signup_started` | Início do cadastro | `source` |
| `signup_completed` | Cadastro finalizado | `method` |
| `login` | Login do usuário | `method` |
| `purchase_started` | Início de compra | `product_id`, `price` |
| `purchase_completed` | Compra finalizada | `product_id`, `price`, `currency` |
| `feature_used` | Uso de feature | `feature_name` |
| `error` | Erros na aplicação | `error_type`, `message` |

---

## Funcionalidades Automáticas

O SDK coleta automaticamente:
- **Session ID**: Identificador único por sessão
- **Device Info**: OS, browser, screen size, language, timezone
- **Timestamps**: Momento exato de cada evento

---

## Notas Importantes

1. **API Key**: Use `pk_live_xxx` para produção, `pk_test_xxx` para desenvolvimento
2. **Batching**: Eventos são enviados em lotes (a cada 10 eventos ou 30 segundos)
3. **Offline**: Eventos são retentados se a conexão falhar
4. **SSR**: O SDK só funciona no client-side (verificar `typeof window !== 'undefined'`)

---

## Dashboard

Visualize seus dados em: **https://luzzi.vercel.app/dashboard**

- `/dashboard` - Analytics (DAU, eventos/dia, top eventos)
- `/dashboard/keys` - Gerenciar API keys
- `/dashboard/settings` - Configurações da conta
