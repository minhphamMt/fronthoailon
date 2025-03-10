import React, { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import "bootstrap/dist/css/bootstrap.min.css";
import "./chat.css";
import DOMPurify from "dompurify";


// Cấu hình marked để hỗ trợ đầy đủ HTML

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const chatBoxRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
marked.setOptions({
  gfm: true,  // Hỗ trợ GitHub Flavored Markdown
  breaks: true, // Xuống dòng với "\n"
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

  const saveMessages = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem("conversation", JSON.stringify(newMessages));
  };

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem("history", JSON.stringify(newHistory));
  };
const renderMessage = (msg) => {
  const cleanHTML = DOMPurify.sanitize(marked.parse(msg.content), { ADD_TAGS: ["iframe"], ADD_ATTR: ["allow", "allowfullscreen"] });
  return { __html: cleanHTML };
};
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    saveMessages(updatedMessages);

    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setIsTyping(false);

      const botMessage = { role: "bot", content: data.response || "No response." };

      // Hiện chữ từ từ
      let index = 0;
      const interval = setInterval(() => {
        if (index <= botMessage.content.length) {
          saveMessages([
            ...updatedMessages,
            { ...botMessage, content: botMessage.content.slice(0, index) },
          ]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 20);

      saveHistory([input, ...history]);
    } catch (error) {
      console.error("Error:", error);
      setIsTyping(false);
      const errorMessage = { role: "bot", content: "⚠️ Error receiving response from the bot." };
      saveMessages([...updatedMessages, errorMessage]);
    }
  };

const handleNewConversation = async () => {
  try {
    // Gọi API xóa database
    await fetch("http://127.0.0.1:5000/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // Xóa dữ liệu trong state và localStorage
    saveMessages([]);
    saveHistory([]);
    localStorage.removeItem("history");

    console.log("🗑️ Database đã được reset!");
  } catch (error) {
    console.error("❌ Lỗi khi reset database:", error);
  }
};

  const handleClearHistory = () => {
    saveHistory([]);
    localStorage.removeItem("history");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    
    <div className="chat-container">
    

      {/* Sidebar */}
      <div className="sidebar">
        <button onClick={handleNewConversation} className="button-lon btn btn-outline-light">Đoạn chat mới</button>
      
    
        
      </div>

      {/* Chatbox */}
      <div className="chat-box-wrapper">
        <div className="chat-box" ref={chatBoxRef}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role === "user" ? "user" : "bot"}`}
              dangerouslySetInnerHTML={renderMessage(msg)}
            />
          ))}
          {isTyping && <div className="typing">• • •</div>}
        </div>

        {/* Input + Options */}
        <div className="input-area">
          <textarea
           value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Nhập câu hỏi của bạn vào đây..."
  style={{ height: "50px" }} // 👈 Cố định chiều cao input
          />
          <button onClick={handleSend} className="btn btn-success">Gửi</button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
