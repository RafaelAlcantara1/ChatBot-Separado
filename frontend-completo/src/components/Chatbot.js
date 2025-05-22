import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chatbot.css';
import { RxAvatar } from "react-icons/rx";
import { FiSend, FiAlertCircle } from "react-icons/fi";

// Constantes para configuração
const MAX_HISTORICO = 10; // Manter histórico maior para melhor contexto
const MENSAGEM_ERRO_API = "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.";
const MENSAGEM_ERRO_REDE = "Parece que você está offline. Verifique sua conexão e tente novamente.";
const STORAGE_KEY = "megaChef_conversationHistory"; // Chave para armazenar no localStorage
const MENSAGEM_BOAS_VINDAS = "Olá! Sou o Mega Chef da Computaria, seu assistente culinário virtual. Como posso ajudar você hoje? Posso sugerir receitas, dar dicas de preparo ou ajudar com substituições de ingredientes.";

// URL base da API do backend
const API_URL = "http://localhost:5000/api/chat";

const Chatbot = () => {
  // Estado para armazenar mensagens, entrada, carregamento e erros
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Referências para auto-rolagem e input
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
  
  // Função para enviar mensagem para o backend
  const sendMessageToBackend = async (message) => {
    try {
      const response = await fetch(`${API_URL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || MENSAGEM_ERRO_API);
      }
      
      return data.message;
    } catch (error) {
      console.error('Erro ao enviar mensagem para o backend:', error);
      throw error;
    }
  };
  
  // Função para limpar a conversa
  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    // Limpar também do localStorage
    localStorage.removeItem(STORAGE_KEY);
  };
  
  // Função para manter foco no textarea
  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Efeito para manter foco no textarea quando o componente montar
  useEffect(() => {
    focusTextarea();
  }, []);
  
  // Efeito para manter foco após cada mensagem
  useEffect(() => {
    focusTextarea();
  }, [messages]);
  
  // Função para enviar mensagem
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    // Adicionar mensagem do usuário
    const newUserMessage = { text: userMessage, isUser: true };
    setMessages(prev => [...prev, newUserMessage]);
    
    setIsLoading(true);
    // Resetar a altura do textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    try {
      const response = await sendMessageToBackend(userMessage);
      // Adicionar resposta do bot
      const newBotMessage = { text: response, isUser: false };
      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error('Erro capturado:', error);
      setError(error.message || MENSAGEM_ERRO_API);
    } finally {
      setIsLoading(false);
      // Forçar foco no textarea após um pequeno delay
      setTimeout(focusTextarea, 100);
    }
  };
  
  // Manipular teclas pressionadas
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  return (
    <div className={`chat-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="chat-header">
        <img alt="logo" src='/imagens/logo.png' className="avatar"/>
        <h1>Mega Chef da Computaria</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button 
            className="clear-button" 
            onClick={handleClearChat}
            title="Limpar conversa"
          >
            Limpar
          </button>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="message bot">
            <img alt="logo" src='/imagens/logo.png' className="avatar"/>
            <div className="message-content">
              <ReactMarkdown>
                {MENSAGEM_BOAS_VINDAS}
              </ReactMarkdown>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isUser ? 'user' : 'bot'}`}>
            <div className="avatar">
              {message.isUser ? <RxAvatar size={30}/> : <img alt="logo" className="avatar" src='/imagens/logo.png'/>}
            </div>
            <div className="message-content">
              <ReactMarkdown>
                {message.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="typing-indicator">
            <img alt="logo" src='/imagens/logo.png' className="avatar"/>
            <div className="message-content">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <FiAlertCircle className="error-icon" />
            <p>{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          disabled={isLoading}
          rows={1}
          autoFocus
          onBlur={focusTextarea}
        />
        <button 
          className="send-button" 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label="Enviar mensagem"
        >
          {isLoading ? (
            <div className="loader"></div>
          ) : (
            <FiSend size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
