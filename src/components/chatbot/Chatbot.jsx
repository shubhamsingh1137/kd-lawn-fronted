import { useState } from "react";
import api from "../../services/api";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello 👋 Welcome to Kalawati Marriage Lawn. How can I help you?"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages(prev => [
      ...prev,
      {
        sender: "user",
        text: userMessage
      }
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/chatbot/message", {
        message: userMessage
      });

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: res.data.reply
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I am unable to respond right now. Please contact us."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-10 right-6 z-50 w-16 h-16 rounded-full bg-gold text-white shadow-xl text-2xl"
        >
          🤖
        </button>
      )}

      {/* Chat Window */}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-30px)] bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}

          <div className="bg-gray-900 text-white p-4 flex justify-between items-center">

            <div>
              <h3 className="font-semibold">
                Kalawati Assistant
              </h3>

              <p className="text-xs text-gray-300">
                Online • Ask me anything
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-xl"
            >
              ×
            </button>

          </div>

          {/* Messages */}

          <div className="h-[400px] overflow-y-auto p-4 space-y-3">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    msg.sender === "user"
                      ? "bg-gold text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-sm text-gray-400">
                Typing...
              </div>
            )}

          </div>

          {/* Input */}

          <div className="border-t p-3 flex gap-2">

            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask something..."
              className="flex-1 input-field"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="btn-gold px-4 rounded-xl"
            >
              ➤
            </button>

          </div>

        </div>
      )}
    </>
  );
}