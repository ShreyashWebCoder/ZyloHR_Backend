const redis = require("redis");

const client = redis.createClient({
    url: process.env.REDIS_URL,
});

client.on("error", (err) => console.error("❌ Redis Error", err));

(async () => {
    try {

        if (!client.isOpen) {
            await client.connect();
            console.log("✅ Redis Connected Successfully...");
        }
        return client;
    } catch (error) {
        console.error("❌ Redis Connection Failed !", error.message);
    }
})();

module.exports = client;
