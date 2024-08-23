const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL)

const db = mongoose.connection;

db.on('connected' , ()=>{
    console.log('Mongo DB Conexão bem-sucedida');
})

db.on('error' , (err)=>{
    console.log('Mongo DB Falha na conexão');
})

module.exports = db;