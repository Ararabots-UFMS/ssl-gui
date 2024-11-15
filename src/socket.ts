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

export const communicationOutput = reactive({
    message: '',
});

export const communicationStatus = reactive({
    status: false,
});
export const refereeOutput = reactive({
    message: '',
});

export const refereeStatus = reactive({
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

socket.on("communicationOutput", (event) => {
    communicationOutput.message = event;
});

socket.on("communicationStatus", (event) => {
    communicationStatus.status = event.status;
});

socket.on("refereeOutput", (event) => {
    refereeOutput.message = event;
});

socket.on("refereeStatus", (event) => {
    refereeStatus.status = event.status;
});
