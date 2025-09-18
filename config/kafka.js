const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
  clientId: "inventory-management-app",
  brokers: process.env.KAFKA_BROKERS.split(","),
  ssl: true, // Confluent Cloud requires SSL
  sasl: {
    mechanism: process.env.KAFKA_MECHANISM || "PLAIN", // default: PLAIN
    username: process.env.KAFKA_USERNAME, // Confluent API Key
    password: process.env.KAFKA_PASSWORD, // Confluent API Secret
  },
  retry: { initialRetryTime: 300, retries: 10 },
});

const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const admin = kafka.admin();

const initializeKafka = async () => {
  await admin.connect();

  const topics = await admin.listTopics();
  const topicName = process.env.KAFKA_TOPIC;

  // ⚠️ Confluent Cloud me usually topic manually UI/CLI se banta hai.
  // Agar tumhaare paas permission hai tabhi create hoga.
  if (!topics.includes(topicName)) {
    await admin.createTopics({
      topics: [
        {
          topic: topicName,
          numPartitions: 3,
          replicationFactor: 3, // Confluent Cloud minimum RF=3 hota hai
        },
      ],
    });
  }

  await admin.disconnect();
};

const connectProducer = async () => await producer.connect();

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: true });
};

const sendMessage = async (message) => {
  await producer.send({
    topic: process.env.KAFKA_TOPIC,
    messages: [
      {
        key: message.product_id?.toString() || null,
        value: JSON.stringify(message),
        timestamp: Date.now().toString(),
      },
    ],
  });
};

const disconnect = async () => {
  await producer.disconnect();
  await consumer.disconnect();
};

module.exports = {
  kafka,
  producer,
  consumer,
  admin,
  initializeKafka,
  connectProducer,
  connectConsumer,
  sendMessage,
  disconnect,
};
