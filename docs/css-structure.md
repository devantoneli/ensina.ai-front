# Estrutura de CSS - Ensina Aí Frontend

## Organização de Estilos

O projeto utiliza uma estrutura modular de CSS, onde cada página tem seu próprio arquivo de estilos específico.

### Arquivos CSS

- **`app/globals.css`** - Estilos globais e configuração do Tailwind
- **`app/login/login.css`** - Estilos específicos da página de login
- **`app/register/register.css`** - Estilos específicos da página de registro
- **`app/chat/chat.css`** - Estilos específicos da página de chat

### Convenções de Nomenclatura

Cada página deve ter:
1. **Prefixo da página** nas classes CSS (ex: `login-`, `register-`, `chat-`)
2. **Arquivo CSS na mesma pasta** da página
3. **Import local** do CSS na página específica

### Exemplo de Uso

```tsx
// app/login/page.tsx
import './login.css';

export default function LoginPage() {
  return (
    <div className="login-container">
      <button className="login-button login-gradient-button">
        Entrar
      </button>
    </div>
  );
}
```

### Tailwind CSS

O projeto utiliza **Tailwind CSS v4** para a maioria dos estilos.

CSS customizado é usado apenas para:
- Animações específicas
- Gradientes complexos
- Estados de hover/focus customizados
- Estilos reutilizáveis dentro de uma página

### Boas Práticas

✅ **Fazer:**
- Usar Tailwind classes para estilos básicos
- Criar CSS customizado para animações e transições
- Prefixar classes CSS com o nome da página
- Manter um arquivo CSS por página/feature

❌ **Evitar:**
- Styles inline com `style={{}}` (exceto para valores dinâmicos)
- Classes CSS genéricas sem prefixo
- Duplicar estilos entre arquivos CSS
- CSS global desnecessário

### Estrutura de Pastas

```
app/
├── globals.css          # Estilos globais + Tailwind
├── layout.tsx           # Layout principal (importa globals.css)
├── login/
│   ├── page.tsx        # Página de login
│   ├── login.tsx       # Implementação da tela
│   └── login.css       # Estilos específicos do login
├── register/
│   ├── page.tsx        # Página de registro
│   ├── register.tsx    # Implementação da tela
│   └── register.css    # Estilos específicos do registro
└── chat/
  ├── page.tsx        # Página de chat
  ├── chat.tsx        # Implementação da tela
  └── chat.css        # Estilos específicos do chat
```

### Gradientes

Gradientes principais do projeto:
- **Primário:** `linear-gradient(to bottom, #5b9fc9, #a8d8e8)`
- **Background lateral:** `linear-gradient(144deg, rgb(91, 159, 201) 17%, rgb(91, 159, 201) 62%, rgb(255, 241, 228) 107%)`

### Cores do Projeto

- **Azul principal:** `#5b9fc9`
- **Azul claro:** `#a8d8e8`
- **Bege:** `#f5e5dc`
- **Bege escuro:** `#ead9cd`
- **Texto dark:** `#2d3748`
- **Texto gray:** `#6b7280`
- **Erro:** `#c10007`
- **Erro bg:** `#fef2f2`
