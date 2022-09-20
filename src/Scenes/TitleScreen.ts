import { GameService } from "../game";
import App from "../lib/App";
import Scene from "../lib/Scene";
import { Routine, WaitFor, WaitForSeconds } from "../lib/Scheduler";
import { Angle, Color, LerpUtils, Random, TextHelper, Utils, Vector2 } from "../lib/Util";

export default class TitleScreenScene extends Scene {
    // -- title text elements -- \\
    private bufferedTitleTextJitterPosition!: Vector2;
    private titleTextJitteredPosition!: Vector2;
    private titleTextPosition!: Vector2;

    private bufferedTitleTextRotation!: number;
    private titleTextRotation!: number;

    private bufferedTitleTextAlpha!: number;
    private titleTextAlpha!: number;

    private bufferedSplashTextAlpha!: number;
    private splashTextAlpha!: number;

    private titleTextStroke!: string;

    private lerpRate!: number;

    private transitioning!: boolean;

    // -- title menu button elements -- \\
    private bufferedPlayButtonColor!: Color.RGB;
    private playButtonColor!: Color.RGB;
    private bufferedPlayButtonAlpha!: number;
    private playButtonAlpha!: number;
    
    constructor(app: App) {
        super(app, "titleScreen");
    }
    
    public setup(): void {
        this.titleTextPosition = new Vector2(0, this.app.center.y);
        this.titleTextStroke = "#00000000";
    
        this.titleTextJitteredPosition = this.titleTextPosition.clone();
        this.titleTextRotation = 0;
        this.titleTextAlpha = 0;
        this.splashTextAlpha = 0;
        this.playButtonColor = new Color.RGB(255, 255, 255);
        this.playButtonAlpha = 0;
    
        this.lerpRate = 0.1;
        
        this.bufferedTitleTextJitterPosition = this.titleTextPosition.clone();
        this.bufferedTitleTextRotation = this.titleTextRotation.valueOf();
        this.bufferedTitleTextAlpha = this.titleTextAlpha.valueOf();
        this.bufferedSplashTextAlpha = this.splashTextAlpha.valueOf();
        this.bufferedPlayButtonColor = this.playButtonColor.clone();
        this.bufferedPlayButtonAlpha = this.playButtonAlpha.valueOf();

        this.transitioning = false;

        const instance = this;

        GameService.currentRoom = null;

        Routine.startTask(function*() {
            yield new WaitForSeconds(0.5);
            if (instance.transitioning) return;

            instance.bufferedTitleTextAlpha = 1;
            instance.titleTextJitteredPosition = new Vector2(0, instance.app.center.y);
            
            yield new WaitForSeconds(2.5);
            if (instance.transitioning) return;
            
            instance.bufferedPlayButtonAlpha = 1;
            instance.titleTextPosition.y = instance.app.height * 0.3;

            yield new WaitForSeconds(0.5);
            if (instance.transitioning) return;
            
            instance.bufferedSplashTextAlpha = 1;

            while ((instance.app.currentScene.name == instance.name) && !instance.transitioning) {
                yield new WaitForSeconds(Random.random(5, 30) / 100);
                if (instance.transitioning) return;

                instance.titleTextStroke = "#00000000";
                
                yield new WaitForSeconds(Random.random(5, 20) / 10);
                if (instance.transitioning) return;
                
                instance.titleTextStroke = Random.sample(["#ff007f", "#ff7f00", "#ffff00", "#7fff00", "#007fff", "#7f00ff"], 1)[0];

                instance.titleTextAlpha = Random.random(0, 10) / 10;
            }
        });

        Routine.startTask(function*() {
            while ((instance.app.currentScene.name == instance.name) && !instance.transitioning) {
                yield new WaitForSeconds(0.1);
                if (instance.transitioning) return;

                instance.bufferedTitleTextJitterPosition = instance.titleTextPosition.clone();
                instance.bufferedTitleTextJitterPosition.x += Random.random(-10, 10);
                instance.bufferedTitleTextJitterPosition.y += Random.random(-10, 10);

                instance.bufferedTitleTextRotation = Random.random(-1, 1);
            }
        });
    }

    public loop(): void {
        this.draw({
            "draw": ctx => {
                TextHelper.writeCenteredTextAt(this, "ReneGade", {
                    "fillStyle": "#ffffff",
                    "origin": this.titleTextJitteredPosition,
                    "rotation": Angle.toRadians(this.titleTextRotation),
                    "alpha": this.titleTextAlpha,
                    "strokeStyle": this.titleTextStroke,
                    "lineWidth": 9
                }, "120px Glaive Regular");

                const width = TextHelper.measureTextWidth(ctx, "ReneGade", "120px Glaive Regular");
                const modPosition = this.titleTextJitteredPosition.clone();
                modPosition.x += width / 2;
                modPosition.y += 80;

                TextHelper.writeCenteredTextAt(this, "alpha", {
                    "fillStyle": "#ffffff",
                    "origin": modPosition,
                    "rotation": Angle.toRadians(this.titleTextRotation),
                    "alpha": this.splashTextAlpha,
                    "strokeStyle": "#ff0000",
                    "lineWidth": 5
                }, "40px Glaive Regular");
            }
        });

        this.draw({
            "draw": () => {
                TextHelper.writeCenteredTextAt(this, "start", {
                    "fillStyle": this.playButtonColor.toString(),
                    "origin": this.app.center,
                    "alpha": this.playButtonAlpha
                }, "50px GameOver Regular");
            }
        });

        const startButtonWidth = TextHelper.measureTextWidth(this.ctx, "start", "50px GameOver Regular");

        if (Utils.isPointInRectangle(this.app.input.mousePos, new Vector2(this.app.center.x - startButtonWidth / 2, this.app.center.y - 25), startButtonWidth, 50)) {
            if (this.app.input.mouseClick) {
                this.transitioning = true;

                const instance = this;

                Routine.startTask(function*() {
                    instance.lerpRate = 0.2;
                    instance.bufferedTitleTextAlpha = 0;
                    instance.bufferedPlayButtonAlpha = 0;
                    instance.bufferedSplashTextAlpha = 0;

                    yield new WaitFor(() => instance.titleTextAlpha <= 0.05);

                    instance.app.enableScene("lobby");
                });
            } else {
                this.bufferedPlayButtonColor = new Color.RGB(255, 0, 0);
                this.app.cursor = "pointer";
            }
        } else {
            this.bufferedPlayButtonColor = new Color.RGB(255, 255, 255);
            this.app.cursor = "default";
        }

        this.titleTextJitteredPosition.x = LerpUtils.lerp(this.titleTextJitteredPosition.x, this.bufferedTitleTextJitterPosition.x, this.lerpRate);
        this.titleTextJitteredPosition.y = LerpUtils.lerp(this.titleTextJitteredPosition.y, this.bufferedTitleTextJitterPosition.y, this.lerpRate);
        this.titleTextRotation = LerpUtils.lerp(this.titleTextRotation, this.bufferedTitleTextRotation, this.lerpRate);
        this.titleTextAlpha = LerpUtils.lerp(this.titleTextAlpha, this.bufferedTitleTextAlpha, this.lerpRate * 0.1);
        this.splashTextAlpha = LerpUtils.lerp(this.splashTextAlpha, this.bufferedSplashTextAlpha, this.lerpRate * 0.5);
        this.playButtonColor.red = LerpUtils.lerp(this.playButtonColor.red, this.bufferedPlayButtonColor.red, this.lerpRate);
        this.playButtonColor.green = LerpUtils.lerp(this.playButtonColor.green, this.bufferedPlayButtonColor.green, this.lerpRate);
        this.playButtonColor.blue = LerpUtils.lerp(this.playButtonColor.blue, this.bufferedPlayButtonColor.blue, this.lerpRate);
        this.playButtonAlpha = LerpUtils.lerp(this.playButtonAlpha, this.bufferedPlayButtonAlpha, this.lerpRate * 0.5);

        this.titleTextPosition.x = this.app.center.x;
    }
}