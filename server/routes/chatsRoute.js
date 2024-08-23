const router = require("express").Router();
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const authMiddleware = require("../middlewares/authMiddleware");

// create a new chat
router.post("/create-new-chat", authMiddleware, async (req, res) => {
  try {
    const newChat = new Chat(req.body);
    const savedChat = await newChat.save();

    // populate members and last message in saved chat
    await savedChat.populate("members");
    res.send({
      success: true,
      message: "Bate-papo criado com sucesso",
      data: savedChat,
    });
  } catch (error) {
    res.send({
      success: false,
      message: "Erro ao criar bate-papo",
      error: error.message,
    });
  }
});

// get all chats of current user

router.get("/get-all-chats", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({
      members: {
        $in: [req.body.userId],
      },
    })
      .populate("members")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
    res.send({
      success: true,
      message: "Bate-papos obtidos com sucesso",
      data: chats,
    });
  } catch (error) {
    res.send({
      success: false,
      message: "Erro ao buscar bate-papos",
      error: error.message,
    });
  }
});

// clear all unread messages of a chat

router.post("/clear-unread-messages", authMiddleware, async (req, res) => {
  try {
    // find chat and update unread messages count to 0
    const chat = await Chat.findById(req.body.chat);
    if (!chat) {
      return res.send({
        success: false,
        message: "Bate-papo não encontrado",
      });
    }
    const updatedChat = await Chat.findByIdAndUpdate(
      req.body.chat,
      {
        unreadMessages: 0,
      },
      { new: true }
    )
      .populate("members")
      .populate("lastMessage");

    // find all unread messages of this chat and update them to read
    await Message.updateMany(
      {
        chat: req.body.chat,
        read: false,
      },
      {
        read: true,
      }
    );
    res.send({
      success: true,
      message: "Mensagens não lidas apagadas com sucesso",
      data: updatedChat,
    });
  } catch (error) {
    res.send({
      success: false,
      message: "Erro ao limpar mensagens não lidas",
      error: error.message,
    });
  }
});

module.exports = router;
