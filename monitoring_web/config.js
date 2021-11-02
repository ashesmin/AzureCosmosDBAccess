const config = {
    endpoint: "<Your Azure Cosmos account URI>",
    key: "<Your Azure Cosmos account key>",
    databaseId: "<Your Database Name>",
    containerId: "<Your Collection Name>",
    partitionKey: { kind: "NodeMCU", paths: ["/_partitionKey"] }
  };
  
  module.exports = config;