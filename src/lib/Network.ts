export default class WSNetworkDriver {
    public url?: string;
    public onOpen: () => void = () => {};
    public onMessage: (message: string) => void = () => {};
    public onClose: (code: number) => void = () => {};
    public onError: (error: any) => void = error => { throw error };
    public eventPacketProperty?: string;
    
    private _websocket?: WebSocket;
    private _connected: boolean = false;
    private _registeredEvents: { [eventName: string]: (((packet: Network.AnyPacket) => void) | null)[] } = {};

    constructor(url?: string | URL) {
        if (url) {
            this.url = url instanceof URL ? url.href : url;
            if (!(this.url.startsWith("ws:") || this.url.startsWith("wss:"))) throw new TypeError(`Invalid protocol ${this.url.split(":")[0]} for websocket`);
        }
    }

    public connect() {
        if (this.connected) return this.onError(new SyntaxError("WebSocket is already connected"));
        if (!this.url) return this.onError(new TypeError("URL is not set"));

        try {
            this._websocket = new WebSocket(this.url);
        } catch (error) {
            return this.onError(error);
        }
        
        this._websocket.onopen = () => {
            this._connected = true;
            this.onOpen()
        };
        
        this._websocket.onmessage = data => {
            try {
                const packet: Network.AnyPacket = JSON.parse(data.data);
                if (this.eventPacketProperty) {
                    const event = packet[this.eventPacketProperty];
                    if (event) {
                        const callbacks = this._registeredEvents[event];

                        if (callbacks) {
                            for (const callback of callbacks) {
                                callback?.bind(this._websocket)(packet);
                            }
                        }
                    }
                }
            } catch (error) {
                if (!(error instanceof SyntaxError)) {
                    throw error;
                }
            }
            this.onMessage(data.data);
        };

        this._websocket.onclose = code => {
            this._connected = false;
            this.onClose(code.code);
        };
        
        this._websocket.onerror = this.onError;
    }

    public on(event: string, cb: (packet: Network.AnyPacket) => void) {
        if (!this.eventPacketProperty) throw new SyntaxError("Set the eventPacketProperty before using this");
        this._registeredEvents[event] = this._registeredEvents[event] || [];
        this._registeredEvents[event].push(cb);
    }

    public removeListeners(event: string, indices: number[] = []) {
        if (indices.length == 0) {
            this._registeredEvents[event] = [];
        } else {
            for (let index of indices) {
                this._registeredEvents[event][index] = null;
            }
        }
    }

    public clearListeners() {
        this._registeredEvents = {};
    }

    public send(packet: { [key: string]: string } | BasePacket) {
        if (packet instanceof BasePacket) {
            this.websocket?.send(JSON.stringify(packet.value()));
        } else {
            this.websocket?.send(JSON.stringify(packet));
        }
    }

    get websocket(): WebSocket | undefined {
        return this._websocket;
    }

    get connected(): boolean {
        return this._connected;
    }
}

export namespace MimeTypes {
    export const AUDIO = {
        MIDI: "audio/midi",
        XMIDI: "audio/x-midi",
        MP3: "audio/mpeg",
        OGG: "audio/ogg",
        OGA: "audio/ogg",
        OPUS: "audio/opus",
        WAV: "audio/wav",
        WEBM: "audio/webm",
        WEBA: "audio/webm"
    };

    export const VIDEO = {
        MP4: "video/mp4",
        MPEG: "video/mpeg",
        OGG: "video/ogg",
        OGV: "video/ogg",
        WEBM: "audio/webm",
        WEBV: "audio/webm"
    };

    export const IMAGE = {
        BMP: "image/bmp",
        GIF: "image/gif",
        ICO: "image/vnd.microsoft.icon",
        JPE: "image/jpeg",
        JPEG: "image/jpeg",
        PNG: "image/png",
        SVG: "image/svg+xml",
        TIFF: "image/tiff",
        WEBM: "image/webp",
        WEBP: "image/webp",
        PDF: "application/pdf"
    };

    export const APPLICATION = {
        BIN: "application/octet-stream",
        CSS: "text/css",
        CSV: "text/csv",
        DOC: "application/msword",
        DOX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        GZ: "application/gzip",
        HTML: "text/html",
        JAR: "application/java-archive",
        JS: "text/javascript",
        JSON: "application/json",
        JSONLD: "application/ld+json",
        MJS: "text/javascript",
        MPKG: "application/vnd.apple.installer+xml",
        OGG: "application/ogg",
        OGX: "application/ogg",
        PDF: "application/pdf",
        PHP: "application/x-httpd-php",
        PPT: "application/vnd.ms-powerpoint",
        PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        RAR: "application/vnd.rar",
        RTF: "application/rtf",
        SH: "application/x-sh",
        SWF: "application/x-shockwave-flash",
        TAR: "application/x-tar",
        XHTML: "application/xhtml+xml",
        XLS: "application/vnd.ms-excel",
        XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        XML: "application/xml",
        ZIP: "application/zip",
        "7Z": "application/x-7z-compressed"
    }

    export const TEXT = {
        PLAIN: "text/plain",
        CSS: "text/css",
        CSV: "text/csv",
        HTML: "text/html",
        JS: "text/javascript",
        JSON: "application/json",
        MJS: "text/javascript",
        TXT: "text/plain"
    }
}

export namespace Network {
    export type AnyPacket = { [key: string]: any };

    export interface DefaultHeaders {
        "Content-Type": string
        "Authorization": string
        "User-Agent": string
        "Origin": string
        "Host": string
        "Accept": string
    }
    
    export interface RequestOptions {
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
        url: URL | string
        headers?: DefaultHeaders | { [k: string]: string }
        body?: any,
        cache?: RequestCache
    }

    export function request(options: RequestOptions, cb?: (error: Response | null, data?: string, response?: Response) => void): Promise<{data: string, response: Response, error?: boolean }> {
        options.body = options.body || null;
        options.headers = options.headers || {
            "Content-Type": MimeTypes.APPLICATION.JSON,
            "Origin": location.href,
            "Host": location.host
        };
        options.url = options.url instanceof URL ? options.url.href : options.url;
        options.cache = options.cache || "default";

        return new Promise((resolve, reject) => {
            fetch(options.url, {
                "method": options.method,
                "body": options.body,
                "headers": options.headers as any,
                "cache": options.cache
            }).then(response => {
                if ((response.status >= 200) && (response.status <= 299)) {
                    response.text().then(data => {
                        if (cb) {
                            return cb(null, data, response);
                        }
                        resolve({ data, response });
                    });
                } else {
                    if (cb) {
                        return cb(response);
                    }
                    reject({ response, error: true });
                }
            });
        });
    }
}

export abstract class BasePacket {
    public value(): { [key: string]: any } {
        return {};
    }
}