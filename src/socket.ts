import { WebSocketServer, WebSocket, type Server as SocketServer } from "ws";
import type { IWebSocket, JWTPayload } from "./types/common.type.js";
import { verifyToken } from "./utils/common.util.js";
import type { Server } from "http";
import { activeSession } from "./app.js";

let io: SocketServer | null = null;
const clients: WebSocket[] = [];
const ID = () => Math.floor(Math.random() * 10_000);

export async function initializeSocketServer(server: Server) {
    io = new WebSocketServer({ server, port: 3000 });

    io.on("connection", async (socket: WebSocket, req) => {
        const webSocket = socket as IWebSocket;

        if (!req?.url) throw new Error("Url not found");
        const token = req.url.split("?")[1]?.trim().split("=")[1]?.trim();
        if (!token) {
            webSocket.send(JSON.stringify({ event: "ERROR", data: { message: "Unauthorized or invalid token" } }));
            return;
        }

        try {
            const decodedData: JWTPayload = verifyToken(token!);
            if (!decodedData) {
                webSocket.send(JSON.stringify({ event: "ERROR", data: { message: "Invalid token payload" } }));
                return;
            };
            webSocket.user = { userId: decodedData.userId, role: decodedData.role }
        } catch (err) {
            webSocket.send(JSON.stringify({ event: "ERROR", data: { message: (err as Error).message || "Failed to verify token!" } }));
            return;
        }

        console.log(`Socket ID connected ${ID()}`);

        webSocket.on("message", (payload: WebSocket.RawData) => {
            const { event, data } = JSON.parse(payload.toString());
            if (!event) throw new Error("Event is required!");
            if (!data) throw new Error("Payload data is required!");

            if (event === "ERROR") {

            }

            if (event === "ATTENDANCE_MARKED") {
                if (webSocket.user.role !== "teacher") webSocket.send(JSON.stringify({
                    event: "ERROR",
                    data: { message: "Forbidden, teacher event only" }
                }));

                if (!activeSession) webSocket.send(JSON.stringify({
                    event: "ERROR",
                    data: { "message": "No active attendance session" }

                }));


            }
        });
    });
}