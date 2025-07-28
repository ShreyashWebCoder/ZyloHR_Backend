const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const verifyRoute = require("./routers/verify");

const app = express();

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
