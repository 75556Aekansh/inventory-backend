const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'inventory-management-app',
  brokers: process.env.KAFKA_BROKERS.split(','),
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

  if (!topics.includes(topicName)) {
    await admin.createTopics({
      topics: [
        {
          topic: topicName,
          numPartitions: 3,
          replicationFactor: 1,
          configEntries: [
            { name: 'cleanup.policy', value: 'delete' },
            { name: 'retention.ms', value: '86400000' }
          ]
        }
      ]
    });
  }

  await admin.disconnect();
};

const connectProducer = async () => await producer.connect();

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_TOPIC });
};

const sendMessage = async (message) => {
  await producer.send({
    topic: process.env.KAFKA_TOPIC,
    messages: [
      { partition: 0, key: message.product_id, value: JSON.stringify(message), timestamp: Date.now().toString() }
    ]
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
  disconnect
};
