import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import ChatArea from "./components/ChatArea";
import UserSearch from "./components/UserSearch";
import UsersList from "./components/UsersList";
import { io } from "socket.io-client";

const socket = io('http://localhost:5000');

function Home() {
  const [searchKey, setSearchKey] = React.useState("");
  const { selectedChat, user } = useSelector((state) => state.userReducer);
  const [onlineUsers, setOnlineUsers] = React.useState([]);

  useEffect(() => {
    // join the room
    if (user) {
      socket.emit("join-room", user._id);
      socket.emit("came-online", user._id);

      socket.on("online-users-updated", (users) => {
        setOnlineUsers(users);
      });
    }
  }, [user]);

  return (
    <div className={`flex gap-5 ${selectedChat ? '' : 'h-[85dvh]'}`}>
      {/* 1st part: user search, users list/chat list */}
      <div className="w-90 bg-white p-5 shadow-lg rounded-lg">
        <UserSearch searchKey={searchKey} setSearchKey={setSearchKey} />
        <UsersList
          searchKey={searchKey}
          socket={socket}
          onlineUsers={onlineUsers}
        />
      </div>

      {/* 2nd part: chatbox */}
      {selectedChat ? (
        <div className="w-full bg-white p-5 shadow-lg rounded-lg">
          <ChatArea socket={socket} />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-cover bg-center rounded-lg" 
          style={{ backgroundColor: "#fcf5eb"}}>
          <div className="bg-white p-10 rounded-lg shadow-lg text-center">
            <h1 className="text-3xl font-semibold text-gray-600 mb-5">
              Selecione um usuário para iniciar uma conversa
            </h1>
            <p className="text-gray-500">Escolha alguém na lista ao lado para começar a trocar mensagens.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
