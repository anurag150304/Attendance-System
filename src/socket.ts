import { WebSocketServer, WebSocket, type Server as SocketServer } from "ws";
import type { IWebSocket, JWTPayload, User } from "./types/common.type.js";
import { verifyToken } from "./utils/common.util.js";
import type { Server } from "http";
import { activeSession } from "./app.js";
import classDB from "./models/class.model.js";

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
            webSocket.send(JSON.stringify({
                event: "ERROR",
                data: { message: "Unauthorized or invalid token" }
            }));
            io?.close();
            return;
        }

        try {
            const decodedData: JWTPayload = verifyToken(token!);
            if (!decodedData) {
                webSocket.send(JSON.stringify({
                    event: "ERROR",
                    data: { message: "Invalid token payload" }
                }));
                io?.close();
                return;
            };
            webSocket.user = { userId: decodedData.userId, role: decodedData.role }
        } catch (err) {
            webSocket.send(JSON.stringify({
                event: "ERROR",
                data: { message: (err as Error).message || "Failed to verify token!" }
            }));
            io?.close();
            return;
        }

        if (!clients.includes(webSocket)) clients.push(webSocket);

        console.log(`Socket ID connected ${ID()}`);

        webSocket.on("message", async (payload: WebSocket.RawData) => {
            const { event, data } = JSON.parse(payload.toString());
            if (!event) throw new Error("Event is required!");
            if (!data) throw new Error("Payload data is required!");

            if (event === "ATTENDANCE_MARKED") {
                if (webSocket.user.role !== "teacher") webSocket.send(JSON.stringify({
                    event: "ERROR",
                    data: { message: "Forbidden, teacher event only" }
                }));

                const { studentId, status } = data;
                if (!studentId || status) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "Missing studentId or status" }
                    }));
                    return;
                }

                if (!activeSession) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "No active attendance session" }
                    }));
                    return;
                }

                const { classId, attendance } = activeSession;
                if (!classId) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "Class id not found in active session!" }
                    }));
                    return;
                }

                const haveClass = await classDB.findById(classId);
                if (!haveClass) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "Unauthorized, Class not found!" }
                    }));
                    return;
                }

                if (!haveClass.teacherId.equals(webSocket.user.userId)) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "Unauthorized, You must own this class first!" }
                    }));
                    return;
                }

                if (attendance[studentId]) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: `Attendance already marked for student Id : ${studentId}` }
                    }));
                    return;
                }

                attendance[studentId] = status || null;

                for (const client of clients) {
                    client.send(JSON.stringify({
                        event: "ATTENDANCE_MARKED",
                        data: {
                            studentId,
                            status: status || null
                        }
                    }));
                }
            } else if (event === "TODAY_SUMMARY") {
                if (webSocket.user.role !== "teacher") webSocket.send(JSON.stringify({
                    event: "ERROR",
                    data: { message: "Forbidden, teacher event only" }
                }));

                if (!activeSession) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "No active attendance session" }
                    }));
                    return;
                }

                const { attendance } = activeSession;
                if (!Object.keys(attendance).length) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "Attendance is empty in active session!" }
                    }));
                    return;
                }

                const present = Object.keys(attendance).filter(val => attendance[val] === "present").length;
                const absent = Object.keys(attendance).filter(val => (attendance[val] === null || attendance[val] === "absent")).length;
                const total = Object.keys(attendance).length;

                for (const client of clients) {
                    client.send(JSON.stringify({
                        event: "TODAY_SUMMARY",
                        data: { present, absent, total }
                    }));
                }
            } else if (event === "MY_ATTENDANCE") {
                if (webSocket.user.role !== "student") webSocket.send(JSON.stringify({
                    event: "ERROR",
                    data: { message: "Forbidden, student event only" }
                }));

                if (!activeSession) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "No active attendance session" }
                    }));
                    return;
                }

                const { attendance } = activeSession;
                if (!Object.keys(attendance).length) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "Attendance is empty in active session!" }
                    }));
                    return;
                }

                const studentStatus = attendance[webSocket.user.userId];
                if (!studentStatus) {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "Your attendance record not stored yet" }
                    }));
                    return;
                }

                // webSocket.send(JSON.stringify({
                //     event: "MY_ATTENDANCE",
                //     data: {
                //         status: studentStatus === null ? "not yet updated"
                //     }
                // }));
            }
        });
    });
}