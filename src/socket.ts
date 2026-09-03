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

export const yellowRobots = reactive<any[]>([]);
export const blueRobots   = reactive<any[]>([]);
export const balls        = reactive<any[]>([]);
export const trajectories = reactive<Map<number, any>>(new Map());

export const socket = io(URL,{cors: {origin: "*"}} as any);

socket.on("connect", () => {
    console.log("Connected to the server");
});

socket.on("disconnect", () => {
    console.log("Disconnected from the server");
});

socket.on("vision_update", (payload) => {
    // Limpar arrays de forma mais eficiente
    yellowRobots.length = 0;
    blueRobots.length = 0;
    balls.length = 0;
    
    // Adicionar novos dados
    yellowRobots.push(...payload.yellow);
    blueRobots.push(...payload.blue);
    balls.push(...payload.balls);
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

// Listener for trajectory updates
socket.on("trajectory_update", (payload) => {
    trajectories.clear();
    
    if (payload.trajectories) {
        payload.trajectories.forEach((robotTrajectory: any) => {
            trajectories.set(robotTrajectory.robot_id, {
                points: robotTrajectory.points,
                totalDuration: robotTrajectory.total_duration,
                color: getTrajectoryColor(robotTrajectory.robot_id)
            });
        });
    }
});

// Define colors for different robots
function getTrajectoryColor(robotId: number): string {
    const colors: Record<number, string> = {
        0: '#0026ffff',  // Vermelho
        1: '#0026ffff',  // Turquesa  
        2: '#0026ffff',  // Azul
        3: '#ffee00ff',  // Verde
        4: '#ffee00ff',  // Amarelo
        5: '#ffee00ff',  // Lilás
    };
    return colors[robotId] || '#888888';
}
