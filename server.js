import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectToMongoDb } from "./config/dbConfig.js";
import userRouter from "./router/userRouter.js";
import categoryRouter from "./router/categoryRouter.js";
import productRouter from "./router/productRouter.js";
import cartRouter from "./router/cartRouter.js";
import Stripe from "stripe";
import historyRouter from "./router/historyRouter.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(cors());
app.use(express.json());

//CREATE PAYMENT INTENT FOR THE STRIPE
//ENDPOINTS FOR STRIPE PAYMENT SETUP
//stripe SDK
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//stripe checkout route
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { totalAmount } = req.body;

    // Ensure totalAmount is a valid number
    if (!totalAmount) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "aud",
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.log("Stripe error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

//connect to mongodb
connectToMongoDb();

// Serve Images to Client
// import path from "path";

// const __dirname = path.resolve();

// app.use(express.static(path.join(__dirname, "/public")));

//Routes
app.use("/api/user", userRouter);
app.use("/api/category", categoryRouter);
app.use("/api/product", productRouter);
app.use("/api/addtocart", cartRouter);
app.use("/api/orderHistory", historyRouter);

//start server
app.listen(PORT, (error) => {
  error
    ? console.log(error)
    : console.log(`server is running at 'http://localhost:8000'`);
});
