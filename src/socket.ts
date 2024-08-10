import { reactive } from "vue";
import { io } from "socket.io-client";

export const position = reactive({
  x: 0,
  y: 0,
  angle: 0,
});

export const visionOutput = reactive({
    message: '',
});

export const visionStatus = reactive({
    status: false,
});

const URL = "http://localhost:5000";

export const socket = io(URL,{cors: {origin: "*"}} as any);

socket.on("connect", () => {
    console.log("Connected to the server");
});

socket.on("disconnect", () => {
    console.log("Disconnected from the server");
});

socket.on("position", (event) => {
    position.y = event.y.toFixed(2);
    position.x = event.x.toFixed(2);
    position.angle = event.angle.toFixed(2);
});

socket.on("visionOutput", (event) => {
    visionOutput.message = event;
});

socket.on("visionStatus", (event) => {
    visionStatus.status = event.status;
});

socket.on("vision_msg", (event) => {
    console.log(event);
});