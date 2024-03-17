const dotenv = require('dotenv');
dotenv.config();
  
module.exports = {
    conn: {
        host: process.env.DB_DASARATA_HOST,
        user: process.env.DB_DASARATA_USER,
        password: process.env.DB_DASARATA_PASS,
        db_name: process.env.DB_DASARATA_OPERATIONAL,
        connectionLimit: 10,
    },
};