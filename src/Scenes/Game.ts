import { GameService } from "../game";
import App from "../lib/App";
import Scene, { DrawOptions, Renderable } from "../lib/Scene";
import { Angle, Color, Force, LerpUtils, Utils, Vector2 } from "../lib/Util";
import { PacketService } from "../packet";

const PLAYER_ACCELERATION = 1;
const PLAYER_SPEED = 5;
const PLAYER_DAMPING = 1;

class Player extends Renderable<GameScene> {
    readonly fill: string;
    readonly stroke: string;

    readonly PLAYER_DIM: number = 20;

    public position: Vector2;

    constructor(scene: GameScene, fill: string, stroke: string) {
        super(scene);

        this.fill = fill;
        this.stroke = stroke;
        this.position = new Vector2(0, 0);
    }

    public value(): DrawOptions {
        return {
            "fillStyle": this.fill,
            "strokeStyle": this.stroke,
            "lineWidth": 9,
            "origin": this.position,
            "draw": ctx => {
                ctx.rect(-this.PLAYER_DIM / 2, -this.PLAYER_DIM / 2, this.PLAYER_DIM, this.PLAYER_DIM);
            }
        };
    }
}

export default class GameScene extends Scene {
    public clientPlayerRenderable!: Player;
    public otherPlayerRenderables!: Player[];

    private cameraDelay!: Vector2;
    private cameraXDelayLerp!: number;
    private cameraYDelayLerp!: number;
    private delayDistance!: number;

    constructor(app: App) {
        super(app, "mainGame");
    }
    
    public setup(): void {
        this.cameraDelay = new Vector2(0, 0);
        this.delayDistance = 50;

        this.clientPlayerRenderable = new Player(this, "#00ff00", Color.Enum.DARK_GREEN);
        this.otherPlayerRenderables = [];

        this.app.network.on("LOCATION", packet => {
            if (this.otherPlayerRenderables.length != packet.d.clients.length) {
                this.otherPlayerRenderables = [];

                for (let i = 0;i < packet.d.clients.length - 1;i++) {
                    this.otherPlayerRenderables.push(new Player(this, "#ff0000", Color.Enum.DARK_RED));
                }
            }

            let playerRenderableIndexOffset = 0;

            for (let i = 0;i < packet.d.clients.length;i++) {
                const client = packet.d.clients[i];

                if (client.id === GameService.clientPlayer.id) {
                    playerRenderableIndexOffset++;
                } else {
                    this.otherPlayerRenderables[i - playerRenderableIndexOffset].position = this.app.getVisualPosition(new Vector2(client.location.x, client.location.y));
                }
            }
        });
    }

    public loop(): void {
        let x_axis_mod = 0;
        let y_axis_mod = 0;

        // TODO add camera lerp

        if (this.app.input.keysDown.includes(this.app.storage.get("upward_keybind"))) {
            GameService.clientPlayer.velocity.add(new Force(Angle.toRadians(270), PLAYER_SPEED * PLAYER_ACCELERATION * this.app.deltaTime));
            y_axis_mod = -1;
        }

        if (this.app.input.keysDown.includes(this.app.storage.get("downward_keybind"))) {
            GameService.clientPlayer.velocity.add(new Force(Angle.toRadians(90), PLAYER_SPEED * PLAYER_ACCELERATION * this.app.deltaTime));
            y_axis_mod = 1;
        }

        if (this.app.input.keysDown.includes(this.app.storage.get("leftward_keybind"))) {
            GameService.clientPlayer.velocity.add(new Force(Angle.toRadians(180), PLAYER_SPEED * PLAYER_ACCELERATION * this.app.deltaTime));
            x_axis_mod = -1;
        }

        if (this.app.input.keysDown.includes(this.app.storage.get("rightward_keybind"))) {
            GameService.clientPlayer.velocity.add(new Force(Angle.toRadians(0), PLAYER_SPEED * PLAYER_ACCELERATION * this.app.deltaTime));
            x_axis_mod = 1;
        }
        
        const XY_PARTS = GameService.clientPlayer.velocity.toVector()

        if (!x_axis_mod) {
            XY_PARTS.x *= 1 - PLAYER_DAMPING;
            this.cameraXDelayLerp = 0.05;
        } else {
            this.cameraXDelayLerp = 0.05;
        }
        
        if (!y_axis_mod) {
            XY_PARTS.y *= 1 - PLAYER_DAMPING;
            this.cameraYDelayLerp = 0.05;
        } else {
            this.cameraYDelayLerp = 0.05;
        }

        this.cameraDelay.x = LerpUtils.lerp(this.cameraDelay.x, x_axis_mod * this.delayDistance, this.cameraXDelayLerp);
        this.cameraDelay.y = LerpUtils.lerp(this.cameraDelay.y, y_axis_mod * this.delayDistance, this.cameraYDelayLerp);
        
        GameService.clientPlayer.velocity = XY_PARTS.toForce();
        GameService.clientPlayer.velocity.magnitude = Utils.clamp(GameService.clientPlayer.velocity.magnitude, 0, PLAYER_SPEED);
        
        this.app.network.send(new PacketService.LocationPacket());
        
        GameService.clientPlayer.loop();
        
        this.app.cameraOffset = Vector2.add(this.cameraDelay, new Vector2(this.app.center.x - GameService.clientPlayer.position.x, this.app.center.y - GameService.clientPlayer.position.y));
        
        this.clientPlayerRenderable.position = Vector2.add(this.cameraDelay, this.app.center);

        this.otherPlayerRenderables.forEach(renderable => this.draw(renderable));
        this.draw(this.clientPlayerRenderable);
    }
}