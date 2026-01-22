import { WebSocketServer, WebSocket, type Server as SocketServer } from "ws";
import type { IWebSocket, JWTPayload } from "./types/common.type.js";
import { verifyToken } from "./utils/common.util.js";
import type { Server } from "http";

let io: SocketServer | null = null;
const clients: WebSocket[] = [];

export async function initializeSocketServer(server: Server) {
    io = new WebSocketServer({ server, port: 3000 });

    io.on("connection", async (socket: WebSocket, req) => {
        const webSocket = socket as IWebSocket;

        if (!req?.url) throw new Error("Url not found");
        const token = req.url.split("?")[1]?.trim().split("=")[1]?.trim();
        if (!token) {
            webSocket.emit("ERROR", { data: { message: "Unauthorized or invalid token" } });
            return io?.close();
        }

        try {
            const decodedData: JWTPayload = verifyToken(token!);
            if (!decodedData) {
                webSocket.emit("ERROR", { data: { message: "Invalid token payload" } });
                return io?.close();
            };
            webSocket.user = { userId: decodedData.userId, role: decodedData.role }
        } catch (err) {
            webSocket.emit("ERROR", { data: { message: (err as Error).message || "Failed to verify token!" } });
            return io?.close();
        }

        // webSocket.on("")

        webSocket.on("ATTENDANCE_MARKED", (payload) => {
            const data = JSON.parse(payload.toLocalString());
        });

        webSocket.on("ERROR", (payload) => {
            const data = JSON.parse(payload.toLocalString());
        });
    });
}

export function sendMessage(event: string, payload: any) {
    if (!event) throw new Error("Event name is required!");
    if (!payload) throw new Error("Payload is required!");
    if (!io) throw new Error("Socket connection is not established!");

    try {
        io.emit(event,)
    } catch (err) {

    }
}