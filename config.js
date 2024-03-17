const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    rabbitMQ: {
        url: process.env.RABBITMQ_URL,
        exchangeName: process.env.RABBITMQ_EXCHANGE_NAME,
    },
    whatsapp: {
        link: process.env.WHATSAPP_API,
    },
    conn: {
        host: process.env.DB_DASARATA_HOST,
        user: process.env.DB_DASARATA_USER,
        password: process.env.DB_DASARATA_PASS,
        db_name: process.env.DB_DASARATA_OPERATIONAL,
    },
};