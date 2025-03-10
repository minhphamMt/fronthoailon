import React, { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import "bootstrap/dist/css/bootstrap.min.css";
import "./chat.css";
import DOMPurify from "dompurify";

interface MessageType {
  role: "user" | "bot";
  content: string;
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  useEffect(() => {
    const savedMessages = localStorage.getItem("conversation");
    const savedHistory = localStorage.getItem("history");
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessages = (newMessages: MessageType[]) => {
    setMessages(newMessages);
    localStorage.setItem("conversation", JSON.stringify(newMessages));
  };

  const saveHistory = (newHistory: string[]) => {
    setHistory(newHistory);
    localStorage.setItem("history", JSON.stringify(newHistory));
  };

  const renderMessage = (msg: MessageType) => {
    const rawHTML = marked.parse(msg.content);
    return { __html: DOMPurify.sanitize(rawHTML) };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: MessageType = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    saveMessages(updatedMessages);

    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("https://hoailon.railway.internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setIsTyping(false);

      const botMessage: MessageType = { role: "bot", content: data.response || "No response." };
      saveMessages([...updatedMessages, botMessage]);
      saveHistory([input, ...history]);
    } catch (error) {
      console.error("Error:", error);
      setIsTyping(false);
      saveMessages([...updatedMessages, { role: "bot", content: "⚠️ Lỗi khi kết nối server." }]);
    }
  };

  const handleNewConversation = async () => {
    try {
      await fetch("https://hoailon.railway.internal/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      saveMessages([]);
      saveHistory([]);
      console.log("🗑️ Database đã được reset!");
    } catch (error) {
      console.error("❌ Lỗi khi reset database:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <button onClick={handleNewConversation} className="button-lon btn btn-outline-light">
          Đoạn chat mới
        </button>
      </div>

      <div className="chat-box-wrapper">
        <div className="chat-box" ref={chatBoxRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`} dangerouslySetInnerHTML={renderMessage(msg)} />
          ))}
          {isTyping && <div className="typing">• • •</div>}
        </div>

        <div className="input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi của bạn vào đây..."
            style={{ height: "50px" }}
          />
          <button onClick={handleSend} className="btn btn-success">
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;