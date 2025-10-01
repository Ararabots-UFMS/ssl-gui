/* import { reactive } from "vue";
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

export const yellowRobots = reactive<any[]>([]);
export const blueRobots   = reactive<any[]>([]);
export const balls        = reactive<any[]>([]);

export const socket = io(URL,{cors: {origin: "*"}} as any);

socket.on("connect", () => {
    console.log("Connected to the server");
});

socket.on("disconnect", () => {
    console.log("Disconnected from the server");
});

socket.on("vision_update", (payload) => {
    yellowRobots.splice(0, yellowRobots.length, ...payload.yellow);
    blueRobots.splice(0,   blueRobots.length,   ...payload.blue);
    balls.splice(0,        balls.length,        ...payload.balls);
  });

// socket.on("position", (event) => {
//     position.y = event.y.toFixed(2);
//     position.x = event.x.toFixed(2);
//     position.angle = event.angle.toFixed(2);
// });

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
 */

import { reactive } from "vue";
import { io } from "socket.io-client";

export const position = reactive({ x: 0, y: 0, angle: 0 });
export const visionOutput = reactive({ message: '' });
export const visionStatus = reactive({ status: false });
export const communicationOutput = reactive({ message: '' });
export const communicationStatus = reactive({ status: false });
export const refereeOutput = reactive({ message: '' });
export const refereeStatus = reactive({ status: false });

export const logOutput = reactive({
  juiz: [],
  visao: [],
  comunicacao: [],
});

const URL = "http://localhost:5000";

export const yellowRobots = reactive<any[]>([]);
export const blueRobots   = reactive<any[]>([]);
export const balls        = reactive<any[]>([]);

export const socket = io(URL,{cors: {origin: "*"}} as any);

socket.on("connect", () => {
    console.log("Connected to the server");
    logOutput.comunicacao.unshift(`[${new Date().toLocaleTimeString()}] Conexão estabelecida.`);
});

socket.on("disconnect", () => {
    console.log("Disconnected from the server");
    logOutput.comunicacao.unshift(`[${new Date().toLocaleTimeString()}] Conexão perdida.`);
});

socket.on("vision_update", (payload) => {
    yellowRobots.splice(0, yellowRobots.length, ...payload.yellow);
    blueRobots.splice(0,   blueRobots.length,   ...payload.blue);
    balls.splice(0,        balls.length,        ...payload.balls);
});

socket.on("visionOutput", (event) => {
    visionOutput.message = event;
    if (event?.line) logOutput.visao.unshift(event.line);
});

socket.on("visionStatus", (event) => {
    visionStatus.status = event.status;
});

socket.on("communicationOutput", (event) => {
    communicationOutput.message = event;
    if (event?.line) logOutput.comunicacao.unshift(event.line);
});

socket.on("communicationStatus", (event) => {
    communicationStatus.status = event.status;
});

socket.on("refereeOutput", (event) => {
    refereeOutput.message = event;
    if (event?.line) logOutput.juiz.unshift(event.line);
});

socket.on("refereeStatus", (event) => {
    refereeStatus.status = event.status;
});