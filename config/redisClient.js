const redis = require("redis");

// const client = redis.createClient({
//     username: process.env.REDIS_USERNAME,
//     password: process.env.REDIS_PASSWORD,
//     socket: {
//         host: process.env.REDIS_URL,
//         port: process.env.REDIS_PORT
//     }
//     // url: process.env.REDIS_URL,
// });

const client = redis.createClient({
    url: process.env.REDIS_URL  
});

client.on("error", (err) => console.error("❌ Redis Error", err));
client.on("connect", () => console.log("✅ Redis Connected Successfully"));

(async () => {
    try {

        if (!client.isOpen) {
            await client.connect();
            await client.set("test", "test");
            const result = await client.get("test");
            if (result === "test") console.log("✅ Redis Test Passed");

        }
        return client;
    } catch (error) {
        console.error("❌ Redis Connection Failed !", error.message);
    }
})();

module.exports = client;
