import mongoose from "mongoose";
const connectDB = async () => await mongoose.connect(process.env.DATABASE_URL as string);
export default connectDB;