import { ClientPlayer, GameService } from "../game";
import App from "../lib/App";
import Scene from "../lib/Scene";
import { Routine, WaitForSeconds } from "../lib/Scheduler";
import { LerpUtils, TextHelper, Vector2 } from "../lib/Util";
import { PacketService } from "../packet";

export default class LobbyScene extends Scene {
    private loadingText: string = "Waiting For Players";
    private loadingOpacity: number = 0;

    private memberCountDisplay: string = "";

    constructor(app: App) {
        super(app, "lobby");
    }

    public setup(): void {
        const instance = this;

        Routine.startTask(function*() {
            while (instance.app.currentScene.name == instance.name) {
                yield new WaitForSeconds(1);
                
                instance.loadingText = "Waiting For Players.";
                
                yield new WaitForSeconds(1);
                
                instance.loadingText = "Waiting For Players..";
                
                yield new WaitForSeconds(1);
                
                instance.loadingText = "Waiting For Players...";
                
                yield new WaitForSeconds(1);
                
                instance.loadingText = "Waiting For Players";
            }
        });

        Routine.startTask(function*() {
            yield new WaitForSeconds(1);

            instance.memberCountDisplay = "Connecting to server...";

            const url = new URL(`ws://${GameService.SERVER_HOST}:${GameService.DEFAULT_PORT}`);

            instance.app.network.url = url;
            instance.app.network.eventPacketProperty = "e";

            instance.app.network.on("HELLO", packet => {
                GameService.clientPlayer = new ClientPlayer(packet.d.client.id, packet.d.client);
                GameService.heartbeatInterval = packet.d.heartbeat_interval;

                console.log("sending room request...");

                instance.app.network.send(new PacketService.RequestRoomPacket());
            });

            instance.app.network.on("ROOM_DATA", packet => {
                if (!GameService.currentRoom) {
                    GameService.currentRoom = {
                        "id": packet.d.room.id,
                        "size": packet.d.size,
                        "clients": []
                    }

                    instance.app.network.send(new PacketService.JoinRoomPacket(GameService.currentRoom.id));
                    
                    console.log("Joining ", GameService.currentRoom.id);
                } else {
                    if (GameService.currentRoom.id == packet.d.room.id) {
                        GameService.currentRoom.clients = [];
                        for (let simpleClient of packet.d.room.clients) {
                            GameService.currentRoom.clients.push(new ClientPlayer(simpleClient.id, simpleClient.displayName));
                        }
                    }
                }

                const clients = GameService.currentRoom.clients.length;

                if (clients >= 8 || clients == GameService.currentRoom.size) {
                    instance.memberCountDisplay = `Starting Soon (${clients}/${GameService.currentRoom.size})`;
                } else {
                    instance.memberCountDisplay = `Waiting (${clients}/${GameService.currentRoom.size})`;
                }
            });

            instance.app.network.on("GAME_START", () => {
                instance.app.enableScene("mainGame");
            });

            instance.app.network.on("ERROR", packet => {
                if (packet.d.close) {
                    instance.app.network.onClose(0);
                }
                console.error(packet.d.reason);
            });
            
            instance.app.network.onOpen = () => {
                instance.app.network.send(new PacketService.HelloPacket(GameService.displayName));
                instance.app.storage.set("heartbeat", true);

                Routine.startTask(function*() {
                    while(instance.app.storage.get("heartbeat")) {
                        console.log("heartbeat");
                        instance.app.network.send(new PacketService.HeartbeatPacket());
                        yield new WaitForSeconds(1);
                    }
                });
            }

            instance.app.network.onClose = () => {
                instance.app.storage.set("heartbeat", false);
                instance.app.enableScene("titleScreen");
                GameService.currentRoom = null;
            }

            instance.app.network.connect();
        });
    }

    public loop(): void {
        this.draw({
            "draw": () => {
                TextHelper.writeCenteredTextAt(this, this.loadingText, {
                    fillStyle: "#ffffff",
                    origin: Vector2.add(this.app.center, new Vector2(0, -100)),
                    alpha: this.loadingOpacity
                }, "50px Helios Regular");
            }
        });

        this.draw({
            "draw": () => {
                TextHelper.writeCenteredTextAt(this, this.memberCountDisplay, {
                    fillStyle: "#ffffff",
                    origin: this.app.center,
                }, "20px Helios Regular");
            }
        });

        this.loadingOpacity = LerpUtils.lerp(this.loadingOpacity, 1, 0.01);
    }
}