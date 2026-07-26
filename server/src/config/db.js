import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from "mongoose";

const dbConnection= async ()=>{
    try{
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database is connected successfully...");
    }catch(err){
        console.log("Database Error ", err);
        process.exit(1);

    }
}

export default dbConnection;