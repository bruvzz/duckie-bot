const path = require("path");
const getAllFiles = require("../utils/getAllFiles");

module.exports = (client) => {
  const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);

  for (const eventFolder of eventFolders) {
    let eventFiles = getAllFiles(eventFolder);
    eventFiles = eventFiles.sort();

    const eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

    for (const eventFile of eventFiles) {
      const eventFunction = require(eventFile);
      client.on(eventName, (...args) => {
        try {
          const result = eventFunction(client, ...args);
          if (result && typeof result.catch === "function") {
            result.catch(err => console.error(`Event ${eventName} error:`, err));
          }
        } catch (err) {
          console.error(`Event ${eventName} error:`, err);
        }
      });
    }
  }
};
