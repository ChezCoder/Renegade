import { GameService } from "../game";
import App from "../lib/App";
import Scene, { DrawOptions, Renderable } from "../lib/Scene";
import { Routine, WaitFor, WaitForSeconds } from "../lib/Scheduler";
import { Angle, Color, LerpUtils, Random, TextHelper, Utils, Vector2 } from "../lib/Util";

class Button extends Renderable<TitleScreenScene> {
    public lerpRate: number;

    public text: string = "";
    public position: Vector2;

    private bufferedColor!: Color.RGB;
    private color!: Color.RGB;
    public bufferedAlpha!: number;
    private alpha!: number;

    constructor(scene: TitleScreenScene, text: string, position: Vector2) {
        super(scene);
        
        this.lerpRate = 0.1;

        this.text = text;
        this.position = position;

        this.color = new Color.RGB(255, 255, 255);
        this.alpha = 0;
        
        this.bufferedColor = this.color.clone();
        this.bufferedAlpha = this.alpha.valueOf();
    }

    public value(): DrawOptions {
        this.color.red = LerpUtils.lerp(this.color.red, this.bufferedColor.red, this.lerpRate);
        this.color.green = LerpUtils.lerp(this.color.green, this.bufferedColor.green, this.lerpRate);
        this.color.blue = LerpUtils.lerp(this.color.blue, this.bufferedColor.blue, this.lerpRate);
        this.alpha = LerpUtils.lerp(this.alpha, this.bufferedAlpha, this.lerpRate * 0.5);

        const startButtonWidth = TextHelper.measureTextWidth(this.scene.ctx, "start", "50px GameOver Regular");

        if (Utils.isPointInRectangle(this.scene.app.input.mousePos, new Vector2(this.scene.app.center.x - startButtonWidth / 2, this.scene.app.center.y - 25), startButtonWidth, 50)) {
            if (this.scene.app.input.mouseClick) {
                this.scene.transitioning = true;

                const instance = this;

                Routine.startTask(function*() {
                    instance.scene.titleText.lerpRate = 0.2;
                    instance.bufferedAlpha = 0;
                    instance.bufferedAlpha = 0;

                    instance.scene.titleText.bufferedAlpha = 0;
                    instance.scene.titleText.bufferedSplashAlpha = 0;

                    yield new WaitFor(() => instance.scene.titleText.alpha <= 0.05);

                    instance.scene.app.enableScene("lobby");
                });
            } else {
                this.bufferedColor = new Color.RGB(255, 0, 0);
                this.scene.app.cursor = "pointer";
            }
        } else {
            this.bufferedColor = new Color.RGB(255, 255, 255);
        }

        return {
            "draw": () => {
                TextHelper.writeCenteredTextAt(this.scene, this.text, {
                    "alpha": this.alpha,
                    "origin": this.position,
                    "fillStyle": this.color.toString(),
                }, "50px GameOver Regular");
            }
        }
    }
}

class TitleText extends Renderable<TitleScreenScene> {
    public text: string = "";
    public splashText: string = "";

    public lerpRate: number = 0.1;

    private bufferedJitterPosition: Vector2;
    private jitteredPosition: Vector2;
    private position: Vector2;

    private stroke: string;
    
    private bufferedRotation: number;
    private rotation: number;
    
    public bufferedAlpha: number;
    public alpha: number;
    public bufferedSplashAlpha: number;
    private splashAlpha: number;
    
    constructor(scene: TitleScreenScene) {
        super(scene);

        this.stroke = "#00000000";

        this.alpha = 0;
        this.bufferedAlpha = this.alpha.valueOf();
        this.splashAlpha = 0;
        this.bufferedSplashAlpha = this.splashAlpha.valueOf();

        this.rotation = 0;
        this.bufferedRotation = this.rotation.valueOf();
        
        this.position = new Vector2(0, this.scene.app.center.y);
        this.jitteredPosition = this.position.clone();
        this.bufferedJitterPosition = this.position.clone();

        const instance = this;

        Routine.startTask(function*() {
            while ((instance.scene.app.currentScene.name == instance.scene.name) && !instance.scene.transitioning) {
                yield new WaitForSeconds(0.1);
                if (instance.scene.transitioning) return;

                instance.bufferedJitterPosition = instance.position.clone();
                instance.bufferedJitterPosition.x += Random.random(-10, 10);
                instance.bufferedJitterPosition.y += Random.random(-10, 10);

                instance.bufferedRotation = Random.random(-1, 1);
            }
        });

        Routine.startTask(function*() {
            yield new WaitForSeconds(0.5);
            if (instance.scene.transitioning) return;

            instance.bufferedAlpha = 1;
            instance.jitteredPosition = new Vector2(0, instance.scene.app.center.y);
            
            yield new WaitForSeconds(2.5);
            if (instance.scene.transitioning) return;
            
            instance.scene.playButton.bufferedAlpha = 1;
            instance.position.y = instance.scene.app.height * 0.3;

            yield new WaitForSeconds(1);
            if (instance.scene.transitioning) return;
            
            instance.bufferedSplashAlpha = 1;

            while ((instance.scene.app.currentScene.name == instance.scene.name) && !instance.scene.transitioning) {
                yield new WaitForSeconds(Random.random(5, 30) / 100);
                if (instance.scene.transitioning) return;

                instance.stroke = "#00000000";
                
                yield new WaitForSeconds(Random.random(5, 20) / 10);
                if (instance.scene.transitioning) return;
                
                instance.stroke = Random.sample(["#ff007f", "#ff7f00", "#ffff00", "#7fff00", "#007fff", "#7f00ff"], 1)[0];

                instance.alpha = Random.random(0, 10) / 10;
            }
        });
    }

    public value(): DrawOptions {
        this.jitteredPosition.x = LerpUtils.lerp(this.jitteredPosition.x, this.bufferedJitterPosition.x, this.lerpRate);
        this.jitteredPosition.y = LerpUtils.lerp(this.jitteredPosition.y, this.bufferedJitterPosition.y, this.lerpRate);
        this.rotation = LerpUtils.lerp(this.rotation, this.bufferedRotation, this.lerpRate);
        this.alpha = LerpUtils.lerp(this.alpha, this.bufferedAlpha, this.lerpRate * 0.1);
        this.splashAlpha = LerpUtils.lerp(this.splashAlpha, this.bufferedSplashAlpha, this.lerpRate * 0.1);
        this.position.x = this.scene.app.center.x;

        return {
            "draw": ctx => {
                TextHelper.writeCenteredTextAt(this.scene, "ReneGade", {
                    "fillStyle": "#ffffff",
                    "origin": this.jitteredPosition,
                    "rotation": Angle.toRadians(this.rotation),
                    "alpha": this.alpha,
                    "strokeStyle": this.stroke,
                    "lineWidth": 9
                }, "120px Glaive Regular");

                const width = TextHelper.measureTextWidth(ctx, "ReneGade", "120px Glaive Regular");
                const modPosition = this.jitteredPosition.clone();
                modPosition.x += width / 2;
                modPosition.y += 80;

                TextHelper.writeCenteredTextAt(this.scene, "alpha", {
                    "fillStyle": "#ffffff",
                    "origin": modPosition,
                    "rotation": Angle.toRadians(this.rotation),
                    "alpha": this.splashAlpha,
                    "strokeStyle": "#ff0000",
                    "lineWidth": 5
                }, "40px Glaive Regular");
            }
        };
    }
}

export default class TitleScreenScene extends Scene {
    public transitioning!: boolean;

    public titleText!: TitleText;
    public playButton!: Button;
    
    constructor(app: App) {
        super(app, "titleScreen");
    }
    
    public setup(): void {
        this.transitioning = false;

        this.titleText = new TitleText(this);
        this.playButton = new Button(this, "start", this.app.center);

        GameService.currentRoom = null;
    }

    public loop(): void {
        this.draw(this.playButton);
        this.draw(this.titleText);
    }
}