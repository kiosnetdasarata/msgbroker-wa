const express = require('express');
const amqp = require('amqplib');
const port = 8000
const app = express();
const mysql = require('mysql2');

config = require('./config.js');
db = require('./database/db');

const consumeMessage = async () => {
    let connection, channel;
    const exchangeName = config.rabbitMQ.exchangeName;
    try {
      connection = await amqp.connect(config.rabbitMQ.url);
      channel = await connection.createChannel();
  
      await channel.assertExchange(exchangeName, "direct");
  
      const q = await channel.assertQueue("send_wa");
  
      await channel.bindQueue(q.queue, exchangeName, "whatsapp");
  
      channel.consume(q.queue, async (msg) => {
        if (!msg || !msg.content) {
          channel.nack(msg, false, false);
          return;
        }
  
        const text = msg.content.toString();
        // console.error(" [x] Received '%s'", text);
  
        let data;
        try {
          data = JSON.parse(text);
        } catch (error) {
        //   console.error('Failed to parse message content:', error);
          channel.nack(msg, false, false);
          return;
        }
  
        if (!data || !data.number || !data.message) {
        //   console.error('Incomplete message data:', data);
          channel.nack(msg, false, false);
          return;
        }
  
        try {
          await sendToEndpoint(data.number, data.message);
          console.error('Message sent successfully');
          channel.ack(msg);
        } catch (error) {
        //   console.error('Failed tosend message:', error);
        //   console.log(data.number);
        //   channel.nack(msg, false, false);

          try {
            const pool = mysql.createPool({
                connectionLimit: 10,
                host: db.conn.host,
                user: db.conn.user,
                password: db.conn.password,
                database: db.conn.db_name,
            });

            pool.getConnection((err, connection) => {
                if (err) {
                    // console.error('Error getting MySQL connection:', err);
                    channel.nack(msg, false, false);
                    return;
                }
                
                // console.log('Connected to MySQL database');

                const newRecord = { 
                    number: data.number, 
                    message: data.message,
                    queue_name: 'send_wa',
                    date: new Date()
                };

                connection.query('INSERT INTO error_messages SET ?', newRecord, (err, results) => {
                    connection.release(); // Melepaskan koneksi kembali ke pool
                    
                    if (err) {
                        channel.nack(msg, false, false);
                        return;
                    }
                    // console.log('New record inserted successfully');
                    // console.log('Inserted record ID:', results.insertId);
                    channel.ack(msg);
                });
            });

        } catch (error) {
            // console.error('Failed to get a connection from the pool:', error);
            channel.nack(msg, false, false);
        }

        }

        await new Promise((resolve) => setTimeout(resolve, 10000));
      });
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
    }
  };

  const sendToEndpoint = async (number, message) => {
    const endpoint = config.whatsapp.link;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, message }),
      });
      
      if (response.status === 422) {
        throw new Error('Number is not a valid!');
      }
  
    } catch (error) {
      throw new Error('Failed to send message to endpoint:', error);
    }
  };

consumeMessage();

app.listen(port, () => {
    console.log("Server started...");
});