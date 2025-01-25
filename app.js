const express = require('express');
const app = express();
require("dotenv").config();
require("./conn/conn");
const cors = require("cors")

const auth = require("./routes/authRoute.js");
const user = require("./routes/userRoute.js"); 
const divisionRouter = require('./routes/divisionRoute.js');
const trainRouter = require('./routes/trainRoute.js');

//cors
app.use(cors());
// Use express.json() to parse incoming JSON requests
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("API is running"));

app.use("/api/auth", auth); // Fix the route path
app.use("/api/user", user)
app.use("/api/division", divisionRouter)
app.use("/api/coach", trainRouter)

// Creating port
app.listen(process.env.PORT, () => {
    console.log(`Server Started at port ${process.env.PORT}`);
});
