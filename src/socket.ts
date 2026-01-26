import { WebSocketServer, WebSocket, type Server as SocketServer } from "ws";
import type { IWebSocket, JWTPayload, User } from "./types/common.type.js";
import { verifyToken } from "./utils/common.util.js";
import type { Server } from "http";
import { activeSession, resetSession } from "./app.js";
import classDB from "./models/class.model.js";
import attendanceDB from "./models/attendance.model.js";
import { Types } from "mongoose";

let io: SocketServer | null = null;
const clients: WebSocket[] = [];
const ID = () => Math.floor(Math.random() * 10_000);

export async function initializeSocketServer(server: Server) {
    io = new WebSocketServer({ server, path: "/ws" });

    io.on("connection", async (socket: WebSocket, req) => {
        const webSocket = socket as IWebSocket;

        if (!req?.url) throw new Error("Url not found");
        const token = req.url.split("?")[1]?.trim().split("=")[1]?.trim();
        if (!token) {
            webSocket.send(JSON.stringify({
                event: "ERROR",
                data: { message: "Unauthorized or invalid token" }
            }));
            webSocket.terminate();
            return;
        }

        try {
            const decodedData: JWTPayload = verifyToken(token!);
            if (!decodedData) {
                webSocket.send(JSON.stringify({
                    event: "ERROR",
                    data: { message: "Invalid token payload" }
                }));
                webSocket.terminate();
                return;
            };
            webSocket.user = { userId: decodedData.userId, role: decodedData.role }
        } catch (err) {
            webSocket.send(JSON.stringify({
                event: "ERROR",
                data: { message: "Unauthorized or invalid token" }
            }));
            webSocket.terminate();
            return;
        }

        if (!clients.includes(webSocket)) clients.push(webSocket);

        console.log(`Socket ID connected ${ID()}`);

        webSocket.on("message", async (payload: WebSocket.RawData) => {
            if (!payload.toLocaleString().includes("{")) {
                webSocket.send(JSON.stringify({
                    event: "ERROR",
                    data: { message: "Invalid message format" }
                }));
                return;
            }
            console.log(payload.toLocaleString());
            const { event, data } = JSON.parse(payload.toLocaleString());
            if (!event) throw new Error("Event is required!");
            if (!data) throw new Error("Payload data is required!");

            switch (event) {
                case "ATTENDANCE_MARKED": {
                    if (webSocket.user.role !== "teacher") {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Forbidden, teacher event only" }
                        }));
                        break;
                    }

                    const { studentId, status } = data;
                    if (!studentId) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Missing studentId" }
                        }));
                        break;
                    }

                    if (!activeSession) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "No active attendance session" }
                        }));
                        break;
                    }

                    const { classId, attendance } = activeSession;
                    if (!classId) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Class id not found in active session!" }
                        }));
                        break;
                    }

                    const haveClass = await classDB.findById(classId);
                    if (!haveClass) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Unauthorized, Class not found!" }
                        }));
                        break;
                    }

                    if (!haveClass.teacherId.equals(webSocket.user.userId)) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Unauthorized, You must own this class first!" }
                        }));
                        break;
                    }

                    if (attendance[studentId]) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: `Attendance already marked for student Id : ${studentId}` }
                        }));
                        break;
                    }

                    attendance[studentId] = status || "not yet updated";

                    for (const client of clients) {
                        client.send(JSON.stringify({
                            event: "ATTENDANCE_MARKED",
                            data: { studentId, status: status || null }
                        }));
                    }
                    break;
                }

                case "TODAY_SUMMARY": {
                    if (webSocket.user.role !== "teacher") {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Forbidden, teacher event only" }
                        }));
                        break;
                    }

                    if (!activeSession) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "No active attendance session" }
                        }));
                        break;
                    }

                    const { attendance } = activeSession;
                    if (!Object.keys(attendance).length) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "No active attendance session" }
                        }));
                        break;
                    }

                    const present = Object.keys(attendance).filter(val => attendance[val] === "present").length;
                    const absent = Object.keys(attendance).filter(val => attendance[val] === "absent").length;
                    const total = Object.keys(attendance).length;

                    for (const client of clients) {
                        client.send(JSON.stringify({
                            event: "TODAY_SUMMARY",
                            data: { present, absent, total }
                        }));
                    }
                    break;
                }

                case "MY_ATTENDANCE": {
                    if (webSocket.user.role !== "student") {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Forbidden, student event only" }
                        }));
                        break;
                    }

                    if (!activeSession) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "No active attendance session" }
                        }));
                        break;
                    }

                    const { attendance } = activeSession;
                    if (!Object.keys(attendance).length) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "No active attendance session" }
                        }));
                        break;
                    }

                    const studentStatus = attendance[webSocket.user.userId];
                    if (!studentStatus) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Your attendance not record yet" }
                        }));
                        break;
                    }

                    webSocket.send(JSON.stringify({
                        event: "MY_ATTENDANCE",
                        data: { status: studentStatus }
                    }));
                    break;
                }

                case "DONE": {
                    if (webSocket.user.role !== "teacher") {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Forbidden, teacher event only" }
                        }));
                        break;
                    }

                    if (!activeSession) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "No active attendance session" }
                        }));
                        break;
                    }

                    const { classId, attendance } = activeSession;

                    if (!classId) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Class id not found in active session!" }
                        }));
                        break;
                    }

                    if (!Object.keys(attendance).length) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "No active attendance session" }
                        }));
                        break;
                    }

                    const haveClass = await classDB.findById(classId).populate<{ studentIds: User[] }>("studentIds");
                    if (!haveClass) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Unauthorized, Class not found!" }
                        }));
                        break;
                    }

                    if (!haveClass.teacherId.equals(webSocket.user.userId)) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "Unauthorized, You must own this class first!" }
                        }));
                        break;
                    }

                    if (!haveClass.studentIds.length) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: "No students found in this class!" }
                        }));
                        break;
                    }

                    const dataToInsert = [];
                    for (const student of haveClass.studentIds) {
                        const stId = student._id.toLocaleString();
                        const status = attendance[stId];
                        dataToInsert.push({
                            classId,
                            studentId: new Types.ObjectId(stId),
                            status: status === "present" ? status : "absent"
                        });
                    }

                    for (const data of dataToInsert) {
                        attendance[data.studentId.toLocaleString()] = data.status as "present" | "absent" | "not yet updated";
                    }

                    try {
                        await attendanceDB.insertMany(dataToInsert);
                    } catch (err) {
                        webSocket.send(JSON.stringify({
                            event: "ERROR",
                            data: { message: (err as Error).message }
                        }));
                        break;
                    }

                    const present = dataToInsert.filter(val => val.status === "present").length;
                    const absent = dataToInsert.filter(val => val.status === "absent").length;
                    const total = dataToInsert.length;

                    for (const client of clients) {
                        client.send(JSON.stringify({
                            event: "DONE",
                            data: {
                                message: "Attendance persisted",
                                present, absent, total
                            }
                        }));
                    }
                    resetSession();
                    break;
                }

                default: {
                    webSocket.send(JSON.stringify({
                        event: "ERROR",
                        data: { message: "Unknown event" }
                    }));
                }
            }
        });
    });

    io.on("close", (socket: WebSocket) => {
        const webSocket = socket as IWebSocket;
        const idx = clients.indexOf(webSocket);
        if (idx) clients.splice(idx, 1);
    });
}