import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GetMessages, SendMessage } from "../../../apicalls/messages";
import { ClearChatMessages } from "../../../apicalls/chats";
import { HideLoader, ShowLoader } from "../../../redux/loaderSlice";
import toast from "react-hot-toast";
import moment from "moment";
import { SetAllChats, SetSelectedChat } from "../../../redux/userSlice";
import store from "../../../redux/store";
import EmojiPicker from "emoji-picker-react";
import { RiCheckLine, RiCheckDoubleLine } from "react-icons/ri";
import { IoIosArrowBack } from "react-icons/io";

function ChatArea({ socket }) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [isReceipentTyping, setIsReceipentTyping] = React.useState(false);
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = React.useState("");
  const { selectedChat, user, allChats } = useSelector(
    (state) => state.userReducer
  );
  const [messages, setMessages] = React.useState([]);
  const receipentUser = selectedChat.members.find(
    (mem) => mem._id !== user._id
  );

  const sendNewMessage = async (image = "") => {
    if (newMessage.trim() === "" && !image) return; // Previne o envio de mensagens vazias

    const tempMessage = {
      chat: selectedChat._id,
      sender: user._id,
      text: newMessage,
      image,
      createdAt: moment().toISOString(),
      read: false,
    };

    // Emite o evento via WebSocket
    socket.emit("send-message", {
      ...tempMessage,
      members: selectedChat.members.map((mem) => mem._id),
    });

    try {
      // Envie a mensagem ao servidor e salve no banco de dados
      const response = await SendMessage(tempMessage);

      if (response.success) {
        setNewMessage("");
        setShowEmojiPicker(false);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const getMessages = async () => {
    try {
      dispatch(ShowLoader());
      const response = await GetMessages(selectedChat._id);
      dispatch(HideLoader());
      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      dispatch(HideLoader());
      toast.error(error.message);
    }
  };

  const clearUnreadMessages = async () => {
    try {
      socket.emit("clear-unread-messages", {
        chat: selectedChat._id,
        members: selectedChat.members.map((mem) => mem._id),
      });

      const response = await ClearChatMessages(selectedChat._id);

      if (response.success) {
        const updatedChats = allChats.map((chat) => {
          if (chat._id === selectedChat._id) {
            return response.data;
          }
          return chat;
        });
        dispatch(SetAllChats(updatedChats));

        // Marque todas as mensagens como lidas no estado local
        setMessages((prevMessages) =>
          prevMessages.map((message) => ({
            ...message,
            read: true,
          }))
        );
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getDateInRegualarFormat = (date) => {
    let result = "";

    if (moment(date).isSame(moment(), "day")) {
      result = moment(date).format("HH:mm");
    } else if (moment(date).isSame(moment().subtract(1, "day"), "day")) {
      result = `Ontem ${moment(date).format("HH:mm")}`;
    } else if (moment(date).isSame(moment(), "year")) {
      result = moment(date).format("DD MMM HH:mm");
    }

    return result;
  };

  useEffect(() => {
    getMessages();

    if (selectedChat?.lastMessage?.sender !== user._id) {
      clearUnreadMessages();
    }

    const receiveMessageHandler = (message) => {
      const tempSelectedChat = store.getState().userReducer.selectedChat;
      if (tempSelectedChat._id === message.chat) {
        setMessages((messages) => [...messages, message]);
      }

      if (
        tempSelectedChat._id === message.chat &&
        message.sender !== user._id
      ) {
        clearUnreadMessages();
      }
    };

    socket.on("receive-message", receiveMessageHandler);

    socket.on("unread-messages-cleared", (data) => {
      const tempAllChats = store.getState().userReducer.allChats;
      const tempSelectedChat = store.getState().userReducer.selectedChat;

      if (data.chat === tempSelectedChat._id) {
        const updatedChats = tempAllChats.map((chat) => {
          if (chat._id === data.chat) {
            return {
              ...chat,
              unreadMessages: 0,
            };
          }
          return chat;
        });
        dispatch(SetAllChats(updatedChats));

        setMessages((prevMessages) => {
          return prevMessages.map((message) => {
            return {
              ...message,
              read: true,
            };
          });
        });
      }
    });

    socket.on("started-typing", (data) => {
      const selctedChat = store.getState().userReducer.selectedChat;
      if (data.chat === selctedChat._id && data.sender !== user._id) {
        setIsReceipentTyping(true);
      }
      setTimeout(() => {
        setIsReceipentTyping(false);
      }, 1500);
    });

    return () => {
      socket.off("receive-message", receiveMessageHandler);
    };
  }, [selectedChat]);

  useEffect(() => {
    const messagesContainer = document.getElementById("messages");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, isReceipentTyping]);

  const onUploadImageClick = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      await sendNewMessage(reader.result);
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && newMessage.trim() !== "") {
      e.preventDefault(); // Previne o comportamento padrão do Enter
      sendNewMessage();
    }
  };

  const handleBackClick = () => {
    dispatch(SetSelectedChat(null));
  };

  return (
    <div className="bg-gray-100 h-[82vh] border rounded-2xl w-full flex flex-col justify-between p-5 shadow-lg">
      {/* Receipent User */}
      <div>
        <div className="flex gap-5 items-center mb-4">
          <button onClick={handleBackClick} className="text-lg font-semibold">
            <IoIosArrowBack />
          </button>
          {receipentUser.profilePic ? (
            <img
              src={receipentUser.profilePic}
              alt="profile pic"
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="bg-gray-500 rounded-full h-12 w-12 flex items-center justify-center">
              <h1 className="uppercase text-xl font-semibold text-white">
                {receipentUser.name[0]}
              </h1>
            </div>
          )}
          <h1 className="uppercase text-lg font-semibold">
            {receipentUser.name}
          </h1>
        </div>
        <hr className="border-gray-300" />
      </div>

      {/* Chat Messages */}
      <div className="h-[60vh] overflow-y-auto p-5 bg-white rounded-lg" id="messages">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => {
            const isCurrentUserIsSender = message.sender === user._id;
            return (
              <div className={`flex ${isCurrentUserIsSender ? "justify-end" : "justify-start"}`} key={index}>
                <div className="flex flex-col gap-1 max-w-xs">
                  {message.text && (
                    <h1
                      className={`${
                        isCurrentUserIsSender
                          ? "bg-[#00510f] text-white rounded-bl-none"
                          : "bg-gray-200 text-gray-900 rounded-tr-none"
                      } p-3 rounded-xl shadow`}
                    >
                      {message.text}
                    </h1>
                  )}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="message"
                      className="w-32 h-32 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex items-center gap-1">
                    <h1 className="text-gray-500 text-xs">
                      {getDateInRegualarFormat(message.createdAt)}
                    </h1>
                    {isCurrentUserIsSender && (
                      <>
                        {message.read ? (
                          <RiCheckDoubleLine className="text-blue-500 text-sm" />
                        ) : (
                          <RiCheckLine className="text-gray-500 text-sm" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {isReceipentTyping && (
            <div className="flex justify-start">
              <h1 className="bg-blue-100 text-[#00510f] p-2 rounded-xl w-max">
                Digitando...
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="h-18 mt-4 rounded-xl border-gray-300 shadow border flex justify-between p-3 items-center bg-white relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2">
            <EmojiPicker
              height={350}
              onEmojiClick={(e) => {
                setNewMessage(newMessage + e.emoji);
              }}
            />
          </div>
        )}

        <div className="flex gap-3 text-xl">
          <label htmlFor="file" className="cursor-pointer">
            <i className="ri-link text-xl"></i>
            <input
              type="file"
              id="file"
              className="hidden"
              accept="image/gif,image/jpeg,image/jpg,image/png"
              onChange={onUploadImageClick}
            />
          </label>
          <i
            className="ri-emotion-line cursor-pointer text-xl"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          ></i>
        </div>

        <input
          type="text"
          placeholder="Digite uma mensagem..."
          className="w-[80%] border-0 focus:ring-0 focus:outline-none"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            socket.emit("typing", {
              chat: selectedChat._id,
              members: selectedChat.members.map((mem) => mem._id),
              sender: user._id,
            });
          }}
          onKeyDown={handleKeyDown} // Chama handleKeyDown ao pressionar uma tecla
        />
        <button
          className="bg-[#00510f] text-white py-1 px-5 rounded-lg flex items-center justify-center"
          onClick={() => sendNewMessage("")}
        >
          <i className="ri-send-plane-2-line text-white text-lg"></i>
        </button>
      </div>
    </div>
  );
}

export default ChatArea;
