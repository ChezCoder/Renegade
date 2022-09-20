import { GameService } from "./game";
import { BasePacket } from "./lib/Network"

export namespace PacketService {
    export interface Packet {
        "e": string,
        "d"?: any
    }

    export class HeartbeatPacket extends BasePacket {
        public value(): Packet {
            return {
                "e": "HEARTBEAT"
            }
        }
    }

    export class HelloPacket extends BasePacket {
        private displayName: string;

        constructor(displayName: string) {
            super();
            this.displayName = displayName;
        }

        public value(): Packet {
            return {
                "e": "HELLO",
                "d": {
                    "displayName": this.displayName
                }
            }
        }
    }

    export class CursorLocationPacket extends BasePacket {
        public value(): Packet {
            return {
                "e": "CURSOR_LOCATION",
                "d": {
                    "client": GameService.clientPlayer.simplify(),
                    "location": GameService.app.input.mousePos.simplify()
                }
            }
        }
    }

    export class RequestRoomPacket extends BasePacket {
        public value(): Packet {
            return {
                "e": "REQUEST_ROOM"
            }
        }
    }

    export class JoinRoomPacket extends BasePacket {
        private roomID: number;

        constructor(roomID: number) {
            super();
            this.roomID = roomID;
        }

        public value(): Packet {
            return {
                "e": "JOIN_ROOM",
                "d": {
                    "id": this.roomID
                }
            }
        }
    }
}