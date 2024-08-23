const router = require("express").Router();
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const authMiddleware = require("../middlewares/authMiddleware");

// new message

router.post("/new-message", async (req, res) => {
  try {
    // store message
    const newMessage = new Message(req.body);
    const savedMessage = await newMessage.save();

    // update last message of chat
    await Chat.findOneAndUpdate(
      { _id: req.body.chat },
      {
        lastMessage: savedMessage._id,
        $inc: { unreadMessages: 1 },
      }
    );

    res.send({
      success: true,
      message: "Mensagem enviada com sucesso",
      data: savedMessage,
    });
  } catch (error) {
    res.send({
      success: false,
      message: "Erro ao enviar mensagem",
      error: error.message,
    });
  }
});

// get all messages of a chat

router.get("/get-all-messages/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId,
    }).sort({ createdAt: 1 });
    res.send({
      success: true,
      message: "Mensagens obtidas com sucesso",
      data: messages,
    });
  } catch (error) {
    res.send({
      success: false,
      message: "Erro ao buscar mensagens",
      error: error.message,
    });
  }
});

module.exports = router;
