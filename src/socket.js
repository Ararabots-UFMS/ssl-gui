import { reactive } from "vue";
import { io } from "socket.io-client";

export const position = reactive({
  x: 0,
  y: 0
});

const URL = "http://localhost:5000";

export const socket = io(URL,{cors: {origin: "*"}});

socket.on("connect", () => {
    console.log("Connected to the server");
});

socket.on("disconnect", () => {
    console.log("Disconnected from the server");
});

socket.on("position", (event) => {
    position.x = event.x;
    position.y = event.y;
});