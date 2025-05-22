const chatResponses = {
  saudacao: [
    "Olá! Como posso ajudar com suas dúvidas sobre culinária?",
    "Oi! Estou aqui para ajudar com receitas e dicas culinárias.",
    "Bem-vindo! Tem alguma pergunta sobre culinária?"
  ],
  despedida: [
    "Até logo! Espero ter ajudado com suas dúvidas culinárias.",
    "Tchau! Volte sempre que precisar de ajuda na cozinha.",
    "Adeus! Foi um prazer ajudar."
  ],
  receitas: [
    "Aqui estão algumas receitas populares que você pode gostar...",
    "Posso sugerir algumas receitas baseadas nos ingredientes que você tem...",
    "Existem várias receitas que combinam com essa ocasião..."
  ],
  ingredientes: [
    "Para substituir esse ingrediente, você pode usar...",
    "Esse ingrediente é essencial para o sabor, mas pode ser substituído por...",
    "Se você não tem esse ingrediente, tente usar..."
  ],
  tecnicas: [
    "Essa técnica de cozinha funciona melhor quando você...",
    "Para dominar essa técnica, é importante prestar atenção em...",
    "Uma dica para melhorar essa técnica é..."
  ],
  desconhecido: [
    "Desculpe, não entendi sua pergunta. Pode reformular?",
    "Não tenho certeza do que você está perguntando. Pode explicar de outra forma?",
    "Hmm, não consegui compreender. Pode fazer a pergunta de outro jeito?"
  ]
};

// Função simples para classificar a mensagem do usuário
function classifyMessage(message) {
  message = message.toLowerCase();
  
  if (message.includes('olá') || message.includes('oi') || message.includes('bom dia') || message.includes('boa tarde') || message.includes('boa noite')) {
    return 'saudacao';
  } else if (message.includes('tchau') || message.includes('adeus') || message.includes('até logo')) {
    return 'despedida';
  } else if (message.includes('receita') || message.includes('como fazer') || message.includes('preparar')) {
    return 'receitas';
  } else if (message.includes('ingrediente') || message.includes('substituir') || message.includes('trocar')) {
    return 'ingredientes';
  } else if (message.includes('técnica') || message.includes('método') || message.includes('como')) {
    return 'tecnicas';
  } else {
    return 'desconhecido';
  }
}

// Função para obter uma resposta aleatória baseada na categoria
function getRandomResponse(category) {
  const responses = chatResponses[category] || chatResponses.desconhecido;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// Controlador para processar mensagens
exports.processMessage = (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mensagem não fornecida' 
      });
    }
    
    const category = classifyMessage(message);
    const response = getRandomResponse(category);
    
    // Simular um pequeno atraso para parecer mais natural
    setTimeout(() => {
      res.status(200).json({
        success: true,
        message: response,
        category: category
      });
    }, 500);
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar mensagem' 
    });
  }
};

// Histórico de mensagens (simulado)
const messageHistory = [];

// Controlador para obter histórico de mensagens
exports.getMessageHistory = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      history: messageHistory
    });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter histórico de mensagens' 
    });
  }
};
