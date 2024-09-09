import mongoose from "mongoose";

export const connectToMongoDb = () => {
  try {
    const connect = mongoose.connect(
      process.env.DB_CONNECT_URL + "ecom-database"
    );
    if (connect) {
      console.log(
        `Database conected: ${process.env.DB_CONNECT_URL}ecom-database`
      );
    }
  } catch (error) {
    console.log("Error:", error);
  }
};
