const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Chaves de API
const GEMINI_API_KEY = "AIzaSyBv-B1bYeKkO3MZ3Kqpgwv0ximNUXG97Ws";
const WEATHER_API_KEY = "236c471e864a13bfe824100061a58d23";

// Middleware
app.use(cors());
app.use(express.json());

// Constantes para configuração
const MODELO_IA = "gemini-2.0-flash";
const MAX_HISTORICO = 10;
const MENSAGEM_ERRO_API = "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.";
const MENSAGEM_ERRO_REDE = "Parece que você está offline. Verifique sua conexão e tente novamente.";

const CONTEXTO_INICIAL = `Você é um assistente culinário virtual chamado Mega Chef da Computaria. Seu principal objetivo é ajudar as pessoas com receitas e dicas culinárias.

Você deve:
1. Focar principalmente em ajudar com receitas, ingredientes e técnicas culinárias
2. Perguntar sobre restrições alimentares e ingredientes disponíveis
3. Oferecer sugestões de receitas baseadas nos ingredientes que a pessoa tem
4. Dar dicas de preparo e truques culinários
5. Adaptar receitas para diferentes restrições alimentares
6. Sugerir harmonizações de pratos e bebidas
7. Compartilhar dicas para melhorar habilidades culinárias

Sobre o clima e horário:
- Só forneça informações sobre o clima quando o usuário explicitamente perguntar
- Só forneça informações sobre data/hora quando o usuário explicitamente perguntar
- Use as informações do clima para sugerir receitas apropriadas
- Não inicie conversas sobre clima ou horário, foque em culinária

Mantenha um tom amigável e profissional, sempre priorizando o tema culinário.`;

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API do Mega Chef da Computaria está funcionando!' });
});

// Função para extrair nome da cidade da mensagem
const extractCityFromMessage = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Padrões para extrair cidade
  const patterns = [
    /(?:horas|hora|horário|data|dia|tempo|clima|temperatura) (?:em|de|na|no|em|para) ([^,.!?]+)/i,
    /(?:que horas|que dia|qual horário|qual data) (?:em|de|na|no|em|para) ([^,.!?]+)/i,
    /(?:clima|tempo|temperatura) (?:em|de|na|no|em|para) ([^,.!?]+)/i,
    /^([^,.!?]+)$/ // Se a mensagem for apenas uma palavra/frase
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

// Função para formatar a data em português
const formatarData = (date, timezone) => {
  const options = {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const dataFormatada = date.toLocaleString('pt-BR', options);
  
  // Capitalizar primeira letra de cada palavra
  return dataFormatada.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Função para obter data e hora baseada na cidade
const getCityDateTime = async (city) => {
  try {
    // Primeiro, obter as coordenadas da cidade
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${WEATHER_API_KEY}`
    );
    
    if (!geoResponse.data || geoResponse.data.length === 0) {
      throw new Error('Cidade não encontrada');
    }
    
    const { lat, lon, name, country } = geoResponse.data[0];

    // Obter o fuso horário da cidade
    const timezoneResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`
    );
    
    const timezone = timezoneResponse.data.timezone;

    // Obter a data atual
    const date = new Date();
    const dataFormatada = formatarData(date, timezone);

    // Calcular diferença de fuso horário com UTC
    const utcOffset = date.getTimezoneOffset();
    const cityOffset = new Date(date.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
    const diffHours = Math.abs(utcOffset - cityOffset) / 60;
    const diffSign = utcOffset > cityOffset ? '+' : '-';

    // Informações adicionais
    const diaSemana = date.toLocaleString('pt-BR', { timeZone: timezone, weekday: 'long' });
    const mes = date.toLocaleString('pt-BR', { timeZone: timezone, month: 'long' });
    const dia = date.getDate();
    const ano = date.getFullYear();
    
    return `Em ${name}, ${country}:\n\n` +
           `📅 Data: ${diaSemana}, ${dia} de ${mes} de ${ano}\n` +
           `⏰ Horário: ${dataFormatada.split(' ').slice(-1)[0]}\n` +
           `🌍 Fuso Horário: UTC${diffSign}${diffHours}:00\n\n` +
           `Agora são ${dataFormatada} no fuso horário local.`;
  } catch (error) {
    console.error('Erro ao obter data/hora:', error);
    throw new Error(`Não foi possível obter a data e hora para ${city}. Verifique se o nome da cidade está correto.`);
  }
};

// Função para obter o clima de uma cidade
const getWeather = async (city) => {
  try {
    // Primeiro, obter as coordenadas da cidade
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${WEATHER_API_KEY}`
    );
    
    if (!geoResponse.data || geoResponse.data.length === 0) {
      throw new Error('Cidade não encontrada');
    }
    
    const { lat, lon, name, country } = geoResponse.data[0];

    // Agora obter o clima usando as coordenadas
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`
    );
    
    const data = weatherResponse.data;
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const humidity = data.main.humidity;
    
    // Sugestões de receitas baseadas no clima
    let recipeSuggestion = '';
    if (temp < 15) {
      recipeSuggestion = 'Com esse clima mais frio, que tal preparar um caldo quentinho? Posso te sugerir uma sopa reconfortante ou um feijão tropeiro bem temperado.';
    } else if (temp < 25) {
      recipeSuggestion = 'O clima está agradável! Que tal um risoto cremoso ou uma massa com molho ao sugo?';
    } else {
      recipeSuggestion = 'Com esse calor, que tal uma salada refrescante ou um ceviche? Posso te ajudar a preparar algo leve e saboroso.';
    }

    if (description.includes('chuva') || description.includes('nublado')) {
      recipeSuggestion += ' E já que está chovendo, podemos fazer algo que aqueça o coração.';
    } else if (description.includes('ensolarado') || description.includes('céu limpo')) {
      recipeSuggestion += ' Com esse sol, podemos preparar algo que combine com um dia bonito.';
    }
    
    return `Em ${name}, ${country}, a temperatura atual é de ${temp}°C, ${description}. Umidade do ar: ${humidity}%.\n\n${recipeSuggestion}\n\nMe diga se você tem alguma restrição alimentar ou ingredientes específicos em casa, e eu posso te dar sugestões mais personalizadas!`;
  } catch (error) {
    console.error('Erro ao obter clima:', error);
    throw new Error(`Não foi possível obter informações do clima para ${city}. Verifique se o nome da cidade está correto.`);
  }
};

// Função para verificar se a mensagem é sobre data/hora
const isDateTimeQuery = (message) => {
  const dateTimeKeywords = [
    'horas', 'hora', 'horário', 'data', 'dia', 'que horas', 'que dia',
    'qual horário', 'qual data', 'que dia é hoje', 'que horas são',
    'data atual', 'horário atual'
  ];
  return dateTimeKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

// Função para verificar se a mensagem é sobre clima
const isWeatherQuery = (message) => {
  const weatherKeywords = ['clima', 'tempo', 'temperatura', 'previsão', 'chuva', 'sol'];
  return weatherKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

// Função para enviar mensagem para a API do Gemini
const sendMessageToGemini = async (message, userCity, historico) => {
  try {
    // Se for uma consulta de clima e tiver a cidade
    if (isWeatherQuery(message) && userCity && userCity !== 'pending') {
      return await getWeather(userCity);
    }
    
    // Se for uma consulta de data/hora e tiver a cidade
    if (isDateTimeQuery(message) && userCity && userCity !== 'pending') {
      return await getCityDateTime(userCity);
    }
    
    // Se chegou aqui, é uma mensagem normal para o Gemini
    const url = `https://generativelanguage.googleapis.com/v1/models/${MODELO_IA}:generateContent?key=${GEMINI_API_KEY}`;
    
    // Preparar histórico de conversa para contexto
    let historicoConversa = '';
    
    // Usar mais mensagens para melhor contexto
    const mensagensRecentes = historico.slice(-MAX_HISTORICO);
    if (mensagensRecentes.length > 0) {
      historicoConversa = 'Histórico da conversa:\n';
      mensagensRecentes.forEach(msg => {
        historicoConversa += `${msg.isUser ? 'Usuário' : 'Assistente'}: ${msg.text}\n`;
      });
    }
    
    const promptComContexto = `${CONTEXTO_INICIAL}\n\n${historicoConversa}\nPergunta atual do usuário: ${message}`;
    
    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            {
              text: promptComContexto
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Erro ao enviar mensagem para o Gemini:', error);
    throw new Error(MENSAGEM_ERRO_API);
  }
};

// Rota para processar mensagens do chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userCity, historico } = req.body;
    
    // Se não tiver mensagem
    if (!message) {
      return res.status(400).json({ error: 'Mensagem não fornecida' });
    }
    
    // Se for uma mensagem de cidade pendente
    if (userCity === 'pending') {
      const city = message.trim();
      
      try {
        // Se a última mensagem era sobre clima, retorna o clima
        if (historico.length > 0 && isWeatherQuery(historico[historico.length - 1].text)) {
          const weatherResponse = await getWeather(city);
          return res.json({ 
            response: weatherResponse,
            userCity: city
          });
        }
        // Se não, retorna o horário
        const dateTimeResponse = await getCityDateTime(city);
        return res.json({ 
          response: dateTimeResponse,
          userCity: city
        });
      } catch (error) {
        return res.json({ 
          response: error.message,
          userCity: null
        });
      }
    }
    
    // Verificar se é uma consulta de clima
    if (isWeatherQuery(message)) {
      // Se não tiver a cidade do usuário salva, perguntar
      if (!userCity) {
        return res.json({ 
          response: "Para te informar sobre o clima, preciso saber em qual cidade você mora. Pode me dizer?",
          userCity: 'pending'
        });
      }
    }

    // Verificar se é uma consulta de data/hora
    if (isDateTimeQuery(message)) {
      // Se não tiver a cidade do usuário salva, perguntar
      if (!userCity) {
        return res.json({ 
          response: "Para te informar a hora correta, preciso saber em qual cidade você mora. Pode me dizer?",
          userCity: 'pending'
        });
      }
    }
    
    // Processar a mensagem com o Gemini
    const response = await sendMessageToGemini(message, userCity, historico || []);
    
    res.json({ response, userCity });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar sua mensagem' });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

