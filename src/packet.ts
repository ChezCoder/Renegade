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

    export class LocationPacket extends BasePacket {
        public value(): Packet {
            return {
                "e": "LOCATION",
                "d": {
                    "client": GameService.clientPlayer.simplify(),
                    "location": GameService.clientPlayer.position.simplify()
                }
            }
        }
    }

    export class RequestRoomPacket extends BasePacket {
        private mode: number;

        constructor(mode: number) {
            super();
            this.mode = mode;
        }
        public value(): Packet {
            return {
                "e": "REQUEST_ROOM",
                "d": {
                    "mode": this.mode
                }
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