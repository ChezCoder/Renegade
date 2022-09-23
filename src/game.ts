import App from "./lib/App";
import { Force, Vector2 } from "./lib/Util";

export default class Game {}

export interface Room {
    id: number
    size: number
    clients: Player[]
}

export class Player {
    readonly id: number;
    readonly displayName: string;

    public position: Vector2;

    constructor(id: number, displayName: string) {
        this.id = id;
        this.displayName = displayName;
        this.position = new Vector2(0, 0);
    }

    public simplify() {
        return {
            id: this.id,
            displayName: this.displayName
        }
    }
}

export class ClientPlayer extends Player {
    public velocity: Force;

    constructor(id: number, displayName: string) {
        super(id, displayName);
        
        this.velocity = new Force(0, 0);
    }

    public loop() {
        this.position.addForce(this.velocity);
    }
}

export namespace GameService {
    export const SERVER_HOST = new URLSearchParams(location.search).get("hostname") || prompt("Server Host");
    export const DEFAULT_PORT = 19999;

    export let app: App;
    export let heartbeatInterval: number;
    export let clientPlayer: ClientPlayer;
    export let displayName: string = "Test Player";
    export let currentRoom: Room | null;
}