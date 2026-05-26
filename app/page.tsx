"use client";

import { useEffect, useState } from "react";
import { socket } from "@/socket";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  userName: string;
}

const Home = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [nameInputValue, setNameInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  const onConnect = () => {
    setIsConnected(true);
    console.log("サーバーに接続しました");
  };

  const onDisconnect = () => {
    setIsConnected(false);
    console.log("サーバーから切断されました");
  };

  const onMessage = (data: any) => {
    const newMessage: Message = {
      id: data.id,
      text: data.text,
      timestamp: new Date(data.timestamp),
      isOwn: data.userId === socket.id,
      userName: data.userName,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleLogin = () => {
    if (!nameInputValue.trim()) return;
    setUserName(nameInputValue);
    setIsLoggedIn(true);
    socket.emit("login", { name: nameInputValue });
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const messageData = {
      text: inputValue,
      userId: socket.id,
      timestamp: new Date(),
    };

    socket.emit("message", messageData);
    setInputValue("");
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message", onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message", onMessage);
    };
  }, []);

  // ログイン画面
  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">チャット</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                value={nameInputValue}
                onChange={(e) => setNameInputValue(e.target.value)}
                onKeyPress={handleNameKeyPress}
                placeholder="名前を入力してください"
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-bold text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={!nameInputValue.trim()}
              className="w-full rounded-lg bg-blue-500 px-4 py-3 font-bold text-white hover:bg-blue-600 disabled:bg-gray-400"
            >
              チャット開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  // チャット画面
  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* ヘッダー */}
      <header className="border-b bg-white px-6 py-4 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">チャット</h1>
            <p className="text-sm font-bold text-gray-600">ユーザー: {userName}</p>
          </div>
          <p className={`text-sm font-bold ${isConnected ? "text-green-600" : "text-red-600"}`}>
            {isConnected ? "✓ 接続中" : "✗ 接続中..."}
          </p>
        </div>
      </header>

      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500">
              メッセージはまだありません
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    msg.isOwn
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-800 shadow"
                  }`}
                >
                  <p className={`text-xs font-bold mb-1 ${
                    msg.isOwn ? "text-blue-100" : "text-gray-600"
                  }`}>
                    {msg.userName}
                  </p>
                  <p className="break-words font-bold">{msg.text}</p>
                  <p
                    className={`text-xs ${
                      msg.isOwn ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 入力フォーム */}
      <footer className="border-t bg-white px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            disabled={!isConnected}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !inputValue.trim()}
            className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600 disabled:bg-gray-400"
          >
            送信
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Home;