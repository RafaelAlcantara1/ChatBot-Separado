# Documentação da API do Backend do Chatbot CulinariaComputaria

## Visão Geral

Esta API fornece endpoints para processar mensagens do chatbot de culinária e gerenciar o histórico de conversas. A API foi desenvolvida usando Node.js e Express.

## Configuração e Execução

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm (gerenciador de pacotes do Node.js)

### Instalação

1. Clone o repositório do backend
2. Navegue até o diretório do projeto
3. Instale as dependências:
```bash
npm install
```

4. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:
```
PORT=5000
NODE_ENV=development
```

5. Inicie o servidor:
```bash
node src/server.js
```

O servidor estará rodando em `http://localhost:5000`

## Endpoints da API

### 1. Verificação do Servidor

- **URL**: `/`
- **Método**: `GET`
- **Descrição**: Verifica se o servidor está funcionando
- **Resposta de Sucesso**:
  - **Código**: 200
  - **Conteúdo**: 
  ```json
  {
    "message": "Bem-vindo à API do Chatbot de Culinária Computaria!"
  }
  ```

### 2. Processar Mensagem do Chatbot

- **URL**: `/api/chat/message`
- **Método**: `POST`
- **Descrição**: Processa uma mensagem enviada pelo usuário e retorna uma resposta do chatbot
- **Parâmetros do Corpo**:
  - `message` (string, obrigatório): Mensagem do usuário

- **Exemplo de Requisição**:
```json
{
  "message": "Como fazer um bolo de chocolate?"
}
```

- **Resposta de Sucesso**:
  - **Código**: 200
  - **Conteúdo**:
  ```json
  {
    "success": true,
    "message": "Aqui estão algumas receitas populares que você pode gostar...",
    "category": "receitas"
  }
  ```

- **Resposta de Erro**:
  - **Código**: 400
  - **Conteúdo**:
  ```json
  {
    "success": false,
    "error": "Mensagem não fornecida"
  }
  ```

### 3. Obter Histórico de Mensagens

- **URL**: `/api/chat/history`
- **Método**: `GET`
- **Descrição**: Retorna o histórico de mensagens trocadas com o chatbot
- **Resposta de Sucesso**:
  - **Código**: 200
  - **Conteúdo**:
  ```json
  {
    "success": true,
    "history": []
  }
  ```

## Integração com o Frontend

Para integrar este backend com o frontend React existente, você precisará fazer requisições HTTP para os endpoints da API. Exemplo de integração usando fetch:

```javascript
// Exemplo de envio de mensagem para o chatbot
async function sendMessage(message) {
  try {
    const response = await fetch('http://localhost:5000/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return { success: false, error: 'Falha na comunicação com o servidor' };
  }
}
```

## Categorias de Respostas

O chatbot classifica as mensagens nas seguintes categorias:

1. **saudacao**: Respostas para cumprimentos
2. **despedida**: Respostas para despedidas
3. **receitas**: Respostas para perguntas sobre receitas
4. **ingredientes**: Respostas para perguntas sobre ingredientes
5. **tecnicas**: Respostas para perguntas sobre técnicas culinárias
6. **desconhecido**: Respostas para mensagens que não se encaixam nas categorias acima

## Notas Adicionais

- Esta é uma implementação básica que pode ser expandida com funcionalidades mais avançadas
- Para um chatbot mais robusto, considere integrar com APIs de processamento de linguagem natural como DialogFlow ou OpenAI
- O histórico de mensagens atual é armazenado em memória e será perdido quando o servidor for reiniciado
