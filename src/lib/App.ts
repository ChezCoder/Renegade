import WSNetworkDriver from "./Network";
import Scene from "./Scene";
import { InputDriver } from "./UserInput";
import { Vector2 } from "./Util";

export type CursorOptions = "alias" |
    "all-scroll" |
    "auto" |
    "cell" |
    "col-resize" |
    "context-menu" |
    "copy" |
    "crosshair" |
    "default" |
    "e-resize" |
    "ew-resize" |
    "grab" |
    "grabbing" |
    "help" |
    "move" |
    "n-resize" |
    "ne-resize" |
    "nesw-resize" |
    "ns-resize" |
    "nw-resize" |
    "nwse-resize" |
    "no-drop" |
    "none" |
    "not-allowed" |
    "pointer" |
    "progress" |
    "row-resize" |
    "s-resize" |
    "se-resize" |
    "sw-resize" |
    "text" |
    "w-resize" |
    "wait" |
    "zoom-in" |
    "zoom-out";

export default class App {
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;

    public network: WSNetworkDriver;
    public input: InputDriver;
    public setup: () => void = () => {};
    public loop: () => void = () => {};
    public clear: boolean = true;
    public storage: Map<String, any> = new Map();
    
    public cameraOffset: Vector2 = new Vector2(0, 0);
    public zoom: number = 1;
    public targetFramerate: number = 60;
    
    private _lastFrameTimestamp: number = Date.now();
    private _width!: number;
    private _height!: number;
    private _scene?: string;
    private _scenes: Map<string, Scene>;

    constructor(width: number, height: number) {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d")!;

        this._scenes = new Map();
        this.network = new WSNetworkDriver();
        this.input = new InputDriver(this);

        this.width = width;
        this.height = height;

        document.body.appendChild(this.canvas);

        this._setup();
    }

    public getVisualPosition(position: Vector2): Vector2 {
        const result = position.clone();
        result.add(this.cameraOffset);
        result.x *= this.zoom;
        result.y *= this.zoom;
        return result;
    }

    public addScene(scene: Scene) {
        this._scenes.set(scene.name, scene);
    }

    public enableScene(name: string) {
        const scene = this._scenes.get(name);
        if (scene) {
            if (scene.persistResources) scene.resource.clear();
            this._scene = name;
            scene.setup();
        } else {
            throw new ReferenceError("No registered scene with that name");
        }
    }
    
    private _setup() {
        this.setup.apply(this);
        this.raf();
    }

    private raf() {
        window.requestAnimationFrame(this.raf.bind(this));
        this.input.step();
        this.loop.apply(this);
        
        if (this.clear) {
            this.ctx.clearRect(0, 0, this._width, this._height);
            this.cursor = "default";
        }
        
        this._scenes.get(this._scene || "")?.loop();
        this._lastFrameTimestamp = Date.now();
    }

    get currentScene(): Scene {
        return this._scenes.get(this._scene || "")!;
    }

    get width() {
        return this._width;
    }

    set width(width: number) {
        this._width = width;
        this.canvas.width = width;
    }

    get height() {
        return this._height;
    }

    set height(height: number) {
        this._height = height;
        this.canvas.height = height;
    }

    get center(): Vector2 {
        return new Vector2(this.width / 2, this.height / 2);
    }

    get deltaTime(): number {
        return (Date.now() - this._lastFrameTimestamp) / (1000 / this.targetFramerate);
    }

    set cursor(cursor: CursorOptions | URL) {
        if (cursor instanceof URL) {
            this.canvas.style.cursor = `url("${cursor.href}")`;
        } else {
            this.canvas.style.cursor = cursor;
        }
    }

    get cursor(): CursorOptions | URL {
        return this.canvas.style.cursor as CursorOptions | URL;
    }
}