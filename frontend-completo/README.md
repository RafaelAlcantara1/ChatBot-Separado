# Mega Chef da Computaria - Frontend

Este é o frontend do projeto Mega Chef da Computaria, um assistente culinário virtual.

## Tecnologias utilizadas

- React
- Vite
- Tailwind CSS
- Lucide Icons
- shadcn/ui

## Instalação

```bash
pnpm install
```

## Execução

```bash
pnpm run dev
```

## Estrutura do projeto

```
chatbot-frontend/
├── public/
│   └── imagens/
│       └── logo.png
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   └── Chatbot.jsx
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
└── package.json
```

## Comunicação com o Backend

O frontend se comunica com o backend através da API REST. Certifique-se de que o backend esteja rodando na porta 3001 antes de iniciar o frontend.

