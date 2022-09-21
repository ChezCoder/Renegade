import { ClientPlayer, GameService } from "../game";
import App from "../lib/App";
import Scene from "../lib/Scene";
import { Routine, WaitForMillis, WaitForSeconds } from "../lib/Scheduler";
import { LerpUtils, TextHelper, Vector2 } from "../lib/Util";
import { PacketService } from "../packet";

export default class LobbyScene extends Scene {
    private loadingText!: string;
    private loadingOpacity!: number;

    private memberCountDisplay!: string;
    private memberCountDisplayColor!: string;

    constructor(app: App) {
        super(app, "lobby");
    }

    public setup(): void {
        this.app.network.clearListeners();

        this.loadingText = "Waiting For Players";
        this.loadingOpacity = 0;

        this.memberCountDisplay = "";
        this.memberCountDisplayColor = "#ffffff";

        GameService.currentRoom = null;

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

            let url: URL;

            try {
                if (GameService.SERVER_HOST) {
                    if (GameService.SERVER_HOST.startsWith("https://") || GameService.SERVER_HOST.startsWith("http://") || 
                    GameService.SERVER_HOST.startsWith("ws://") || GameService.SERVER_HOST.startsWith("wss://")) {
                        url = new URL(GameService.SERVER_HOST);
                    } else {
                        url = new URL("https://" + GameService.SERVER_HOST);
                    }
                    
                    if (GameService.SERVER_HOST.endsWith(":443") || GameService.SERVER_HOST.endsWith(":443/")) {
                        url.port = "0";
                    }

                    if (!url.protocol.startsWith("ws")) {
                        url.protocol = location.protocol == "https:" ? "wss:" : "ws:";
                    }

                    url.port = url.port || GameService.DEFAULT_PORT.toString();
                } else {
                    throw new Error("Invalid server hostname");
                }
            } catch {
                instance.app.enableScene("error");
                instance.app.storage.set("error", "Invalid server hostname");
                return;
            }

            if (url.port === "0") {
                url.port = "443";
            }

            instance.app.network.url = url.href;
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
                console.log(packet.d.reason);

                if (packet.d.close) {
                    instance.app.network.onClose(0);
                }
                
                Routine.startTask(function*() {
                    yield new WaitForMillis(100);
                    
                    instance.app.storage.set("error", "Client error");
                    instance.app.storage.set("error_details", packet.d.reason);
                    instance.app.enableScene("error");
                });
            });
            
            instance.app.network.onOpen = () => {
                instance.app.network.send(new PacketService.HelloPacket(GameService.displayName));
                instance.app.storage.set("heartbeat", true);

                Routine.startTask(function*() {
                    while(instance.app.storage.get("heartbeat")) {
                        instance.app.network.send(new PacketService.HeartbeatPacket());
                        yield new WaitForSeconds(1);
                    }
                });
            }

            instance.app.network.onClose = code => {
                if (code.toString() != "1001" || code.toString() != "1000") {
                    instance.app.storage.set("error", "Server error");
                    instance.app.storage.set("error_details", `A server-side error occurred`);
                } else {
                    instance.app.storage.set("error", "Room closed");
                    instance.app.storage.set("error_details", `Room was forcefully closed by the server`);
                }
                
                instance.app.enableScene("error");
                instance.app.storage.set("heartbeat", false);
            }

            instance.app.network.onError = error => {
                console.log(error);

                Routine.startTask(function*() {
                    yield new WaitForMillis(100);
                    
                    instance.app.storage.set("error", "Invalid server hostname");
                    instance.app.storage.set("error_details", `${instance.app.network.url || ""}`);
                    instance.app.enableScene("error");
                });
            };

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
                    fillStyle: this.memberCountDisplayColor,
                    origin: this.app.center,
                }, "20px Helios Regular");
            }
        });

        this.loadingOpacity = LerpUtils.lerp(this.loadingOpacity, 1, 0.01);
    }
}