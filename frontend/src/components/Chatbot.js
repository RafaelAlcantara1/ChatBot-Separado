import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chatbot.css';
import { RxAvatar } from "react-icons/rx";
import { FiSend, FiAlertCircle } from "react-icons/fi";

// Constantes para configuração
const MAX_HISTORICO = 10;
const MENSAGEM_ERRO_API = "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.";
const MENSAGEM_ERRO_REDE = "Parece que você está offline. Verifique sua conexão e tente novamente.";
const STORAGE_KEY = "megaChef_conversationHistory";

// URL do backend
const BACKEND_URL = 'https://chatbot-separado.onrender.com';

const MENSAGEM_BOAS_VINDAS = `Olá! Sou o Mega Chef da Computaria, seu assistente culinário virtual, pronto para te ajudar com:

- Sugestões de receitas com os ingredientes que você tem.
- Dicas de preparo e truques para acertar no prato.
- Adaptações conforme suas restrições ou preferências alimentares.
- Harmonizações entre comidas e bebidas.
- Segredos para melhorar suas habilidades na cozinha.
- Informações sobre o clima para ajudar no planejamento das suas refeições.

Para começar, me conte se tem alguma restrição alimentar ou preferência, e o que tem disponível na sua despensa. Vamos cozinhar juntos... com dados!`;

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Carregar mensagens do localStorage quando o componente montar
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Erro ao carregar mensagens salvas:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);
  
  // Salvar mensagens no localStorage sempre que o estado messages mudar
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);
  
  // Auto-ajuste da altura do textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  // Rolagem automática para a mensagem mais recente
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Ajustar altura do textarea quando o input muda
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Verificar conexão de rede
  const isOnline = () => {
    return navigator.onLine;
  };

  // Função para enviar mensagem para o backend
  const sendMessageToBackend = async (message) => {
    try {
      if (!isOnline()) {
        throw new Error(MENSAGEM_ERRO_REDE);
      }

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: messages.slice(-MAX_HISTORICO).map(msg => ({
            role: msg.isUser ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(MENSAGEM_ERRO_API);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  };

  // Função para limpar o chat
  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Função para focar no textarea
  const focusTextarea = () => {
    textareaRef.current?.focus();
  };

  // Função para enviar mensagem
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      // Adicionar mensagem do usuário
      setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

      // Obter resposta do backend
      const response = await sendMessageToBackend(userMessage);

      // Adicionar resposta do bot
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Função para alternar tema
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className={`chatbot-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="chatbot-header">
        <h1>Mega Chef da Computaria</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <ReactMarkdown>{MENSAGEM_BOAS_VINDAS}</ReactMarkdown>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isUser ? 'user' : 'bot'}`}>
            <div className="avatar">
              {message.isUser ? <RxAvatar /> : '🤖'}
            </div>
            <div className="message-content">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="typing-indicator">
            <div className="avatar">🤖</div>
            <div className="message-content">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          rows={1}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
          <FiSend />
        </button>
      </div>

      <button onClick={handleClearChat} className="clear-chat">
        Limpar Conversa
      </button>
    </div>
  );
};

export default Chatbot;