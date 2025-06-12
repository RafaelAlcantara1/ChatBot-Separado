// Importa os módulos necessários
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares ---
// Configuração do CORS para produção
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL do frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Variáveis e Configuração ---
let db;
const NOME_BOT = "CulinariaComputariaBot";

// Configuração do Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBv-B1bYeKkO3MZ3Kqpgwv0ximNUXG97Ws";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const MODELO_IA = "gemini-2.0-flash";

// String de conexão do MongoDB
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://user_log_acess:Log4c3ss2025@cluster0.nbt3sks.mongodb.net/IIW2023A_Logs?retryWrites=true&w=majority&appName=Cluster0";

// Contexto inicial do chatbot
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

// --- Middleware de Tratamento de Erros ---
const errorHandler = (err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message
    });
};

// --- Conexão com o MongoDB Atlas ---
const connectDB = async () => {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db("IIW2023A_Logs");
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
    } catch (error) {
        console.error("❌ Falha ao conectar ao MongoDB Atlas:", error);
        process.exit(1);
    }
};

// --- Endpoints da API ---
app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'API do CulinariaComputariaBot está no ar!' });
});

app.get('/api/user-info', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    res.json({ ip });
});

// Endpoint para o Gemini
app.post('/api/chat', async (req, res, next) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Mensagem é obrigatória." });
        }

        const model = genAI.getGenerativeModel({ model: MODELO_IA });
        
        // Preparar o histórico de mensagens
        const chatHistory = history || [];
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 2048,
            },
        });

        // Enviar a mensagem e obter a resposta
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // Registrar a interação no MongoDB
        if (db) {
            const agora = new Date();
            const logEntry = {
                col_data: agora.toISOString().split('T')[0],
                col_hora: agora.toTimeString().split(' ')[0],
                col_IP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                col_nome_bot: NOME_BOT,
                col_acao: "chat_interaction",
                col_mensagem: message,
                col_resposta: text
            };
            const collection = db.collection("tb_cl_user_log_acess");
            await collection.insertOne(logEntry);
        }

        res.json({ response: text });
    } catch (error) {
        next(error);
    }
});

app.post('/api/log-connection', async (req, res, next) => {
    try {
        if (!db) {
            throw new Error("Conexão com o banco de dados não estabelecida.");
        }
        
        const { ip, acao } = req.body;
        if (!ip || !acao) {
            return res.status(400).json({ error: "IP e ação são obrigatórios." });
        }

        const agora = new Date();
        const logEntry = {
            col_data: agora.toISOString().split('T')[0],
            col_hora: agora.toTimeString().split(' ')[0],
            col_IP: ip,
            col_nome_bot: NOME_BOT,
            col_acao: acao
        };
        
        const collection = db.collection("tb_cl_user_log_acess");
        await collection.insertOne(logEntry);
        res.status(201).json({ message: "Log registrado com sucesso." });
    } catch (error) {
        next(error);
    }
});

// Aplica o middleware de tratamento de erros
app.use(errorHandler);

// --- Inicialização do Servidor ---
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Servidor backend rodando em http://localhost:${port}`);
    });
});