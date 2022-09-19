import { GameService } from "../game";
import App from "../lib/App";
import Scene from "../lib/Scene";
import { Vector2 } from "../lib/Util";
import { PacketService } from "../packet";

export default class GameScene extends Scene {
    private previousMouseLocation: Vector2;

    private clientCursorLocations: any[] = [];

    constructor(app: App) {
        super(app, "mainGame");

        this.previousMouseLocation = this.app.input.mousePos.clone();
    }

    public setup(): void {
        this.app.network.on("CURSOR_LOCATION", packet => {
            this.clientCursorLocations = packet.d.clients;
        });
    }

    public loop(): void {
        if (!this.previousMouseLocation.equals(this.app.input.mousePos)) {
            this.app.network.send(new PacketService.CursorLocationPacket());
        }
        this.previousMouseLocation = this.app.input.mousePos.clone();

        for (let location of this.clientCursorLocations) {
            const client = GameService.currentRoom?.clients.find(client => client.id == location.id)!;

            if (client.id == GameService.clientPlayer.id) continue;

            this.draw({
                "origin": new Vector2(location.location.x, location.location.y),
                "fillStyle": "#ff0000",
                "lineWidth": 7,
                "strokeStyle": "#770000",
                "draw": ctx => {
                    ctx.rect(-10, -10, 20, 20);
                }
            });
        }

        this.draw({
            "origin": this.app.input.mousePos.clone(),
            "fillStyle": "#00ff00",
            "lineWidth": 7,
            "strokeStyle": "#007700",
            "draw": ctx => {
                ctx.rect(-10, -10, 20, 20);
            }
        });
    }
}