const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const http = require("http");
const socketIo = require("socket.io");

const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const verifyRoute = require("./routers/verify");
const Message = require("./models/message.model");
const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

const connectedUsers = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Handle user registration
  socket.on("register", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ID: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const [userId, id] of connectedUsers.entries()) {
      if (id === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  // Handle private messages
  socket.io("privateMessage", async (data) => {
    try {
      const { senderId, receiverId, content } = data;

      const message = await saveMessageToDB(senderId, receiverId, content);

      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", message);
      }

      socket.emit("messageSent", message);
      console.log(`Message sent from ${senderId} to ${receiverId}: ${content}`);
    }
    catch (error) {
      console.error("Error handling private message:", error);
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId: data.senderId,
        isTyping
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Remove user from connectedUsers map
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

});

app.set("io", io);

//  CORS
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

//  Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//  Default route
app.get("/", (req, res) => {
  res.send("Server Started Sucessfully !");
});


// app.use("/api", verifyRoute);

//  Routes
const authRouter = require("./routers/auth.router");
const apiRouter = require("./routers/api.router");

app.use("/auth", authRouter);
app.use("/api", apiRouter);

const PORT = process.env.PORT || 8000;

//  Server Start
app.listen(PORT, '0.0.0.0', () => {
  connectDB();
  console.log(`Server is ruuning up ! PORT : ${PORT}`);
});


async function saveMessageToDB(senderId, receiverId, content) {
  try {
    const message = new Message({
      _id: Date.now().toString(),
      sender: senderId,
      receiver: receiverId,
      content,
      timestamp: new Date()
    });

    const savedMessage = await message.save();
    console.log("Message saved to DB:", savedMessage);

    return savedMessage;
  } catch (error) {
    console.error("Error saving message to DB:", error);
    throw error;
  }

}