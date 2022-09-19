import App from "./lib/App";

export default class Game {}

export interface Room {
    id: number
    size: number
    clients: Player[]
}

export class Player {
    readonly id: number;
    readonly displayName: string;

    constructor(id: number, displayName: string) {
        this.id = id;
        this.displayName = displayName;
    }

    public simplify() {
        return {
            id: this.id,
            displayName: this.displayName
        }
    }
}

export class ClientPlayer extends Player {
}

export namespace GameService {
    export const SERVER_HOST = "localhost";
    export const DEFAULT_PORT = 19999;

    export let app: App;
    export let heartbeatInterval: number;
    export let clientPlayer: ClientPlayer;
    export let displayName: string = "Test Player";
    export let currentRoom: Room | null;
}