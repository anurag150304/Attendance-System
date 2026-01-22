import "dotenv/config";
import { createServer } from "http";
import App from "./app.js";
import { initializeSocketServer } from "./socket.js";

const server = createServer(App);
const PORT = process.env.PORT || 3000;

await initializeSocketServer(server);
server.listen(PORT, () => console.log(`server listining on port ${PORT}`));