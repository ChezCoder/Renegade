import { GameService } from "../game";
import App from "../lib/App";
import Scene, { DrawOptions, Renderable } from "../lib/Scene";
import { Routine, WaitFor, WaitForSeconds } from "../lib/Scheduler";
import { Angle, Color, LerpUtils, Random, TextHelper, Utils, Vector2 } from "../lib/Util";

class Button extends Renderable<TitleScreenScene> {
    public lerpRate: number;

    public text: string = "";
    public y: number;
    public x: number;

    public onclick: Function = () => {};

    private bufferedColor!: Color.RGB;
    private color!: Color.RGB;
    public bufferedAlpha!: number;
    private alpha!: number;

    constructor(scene: TitleScreenScene, text: string, y: number) {
        super(scene);
        
        this.lerpRate = 0.1;

        this.text = text;
        this.y = y;
        this.x = scene.app.center.x;

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
        this.x = LerpUtils.lerp(this.x, this.scene.app.center.x, this.lerpRate);

        const startButtonWidth = TextHelper.measureTextWidth(this.scene.ctx, "start", "50px GameOver Regular");

        if (Utils.isPointInRectangle(this.scene.app.input.mousePos, new Vector2(this.scene.app.center.x - startButtonWidth / 2, this.y - 25), startButtonWidth, 50)) {
            if (this.scene.app.input.mouseClick) {
                this.scene.transitioning = true;

                const instance = this;

                Routine.startTask(function*() {
                    instance.scene.titleText.lerpRate = 0.2;
                    instance.scene.titleText.bufferedAlpha = 0;
                    instance.scene.titleText.bufferedSplashAlpha = 0;
                    instance.scene.titleText.elementController.forEach(element => element.bufferedAlpha = 0);

                    yield new WaitFor(() => instance.scene.titleText.alpha <= 0.05);
                    
                    instance.onclick();
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
                    "origin": new Vector2(this.x, this.y),
                    "fillStyle": this.color.toString(),
                }, "50px GameOver Regular");
            }
        }
    }
}

class OptionsSelector extends Renderable<TitleScreenScene> {
    private selectedIndex: number;
    public options: string[];
    
    private leftX: number;
    private bufferedLeftX: number;
    private leftColor: Color.RGB;
    private bufferedLeftColor: Color.RGB;
    
    private rightX: number;
    private bufferedRightX: number;
    private rightColor: Color.RGB;
    private bufferedRightColor: Color.RGB;

    public bufferedAlpha: number;
    private globalAlpha: number;

    private position: Vector2;

    private buttonGap: number = 20;

    private lerpRate: number = 0.1;

    constructor(scene: TitleScreenScene, position: Vector2, options: string[]) {
        super(scene);

        this.options = options
        this.selectedIndex = 0;
        this.position = position;

        this.globalAlpha = 0;
        this.bufferedAlpha = this.globalAlpha.valueOf();

        this.leftX = position.x - this.buttonGap;
        this.bufferedLeftX = this.leftX.valueOf();
        this.leftColor = new Color.Hex("#ffffff").toRGB();
        this.bufferedLeftColor = this.leftColor.clone();

        this.rightX = position.x + this.buttonGap;
        this.bufferedRightX = this.rightX.valueOf();
        this.rightColor = new Color.Hex("#ffffff").toRGB();
        this.bufferedRightColor = this.rightColor.clone();
    }

    public value(): DrawOptions {
        const font = "GameOver";
        const selectedW = TextHelper.measureTextWidth(this.scene.app.ctx, this.options[this.selectedIndex], `25px ${font} Regular`);

        this.leftColor.red = LerpUtils.lerp(this.leftColor.red, this.bufferedLeftColor.red, this.lerpRate);
        this.leftColor.green = LerpUtils.lerp(this.leftColor.green, this.bufferedLeftColor.green, this.lerpRate);
        this.leftColor.blue = LerpUtils.lerp(this.leftColor.blue, this.bufferedLeftColor.blue, this.lerpRate);

        this.rightColor.red = LerpUtils.lerp(this.rightColor.red, this.bufferedRightColor.red, this.lerpRate);
        this.rightColor.green = LerpUtils.lerp(this.rightColor.green, this.bufferedRightColor.green, this.lerpRate);
        this.rightColor.blue = LerpUtils.lerp(this.rightColor.blue, this.bufferedRightColor.blue, this.lerpRate);

        this.leftX = LerpUtils.lerp(this.leftX, this.bufferedLeftX - selectedW / 2, this.lerpRate);
        this.rightX = LerpUtils.lerp(this.rightX, this.bufferedRightX + selectedW / 2, this.lerpRate);

        this.globalAlpha = LerpUtils.lerp(this.globalAlpha, this.bufferedAlpha, this.lerpRate / 2);

        return {
            "draw": () => {
                const sideHitboxSize = 15;
                const gapY = 5;

                console.log(this.globalAlpha);

                TextHelper.writeCenteredTextAt(this.scene, "<", {
                    "fillStyle": this.leftColor.toString(),
                    "origin": new Vector2(this.leftX, this.position.y + gapY),
                    "alpha": this.globalAlpha
                }, `40px ${font} Regular`);

                if (this.selectedIndex === 0) {
                    this.bufferedLeftColor = new Color.RGB(0, 0, 0);
                } else {
                    if (Utils.isPointInRectangle(this.scene.app.input.mousePos, new Vector2(this.leftX - sideHitboxSize / 2, this.position.y + gapY - sideHitboxSize / 2), sideHitboxSize, sideHitboxSize)) {
                        if (this.scene.app.input.mouseClick) {
                            this.selectedIndex--;
                        }

                        this.bufferedLeftColor = new Color.RGB(255, 0, 0);
                        this.scene.app.cursor = "pointer";
                    } else {
                        this.bufferedLeftColor = new Color.RGB(255, 255, 255);
                    }
                }

                TextHelper.writeCenteredTextAt(this.scene, this.options[this.selectedIndex], {
                    "fillStyle": "#ffffff",
                    "origin": new Vector2(this.position.x, this.position.y),
                    "alpha": this.globalAlpha
                }, `25px ${font} Regular`);

                TextHelper.writeCenteredTextAt(this.scene, ">", {
                    "fillStyle": this.rightColor.toString(),
                    "origin": new Vector2(this.rightX, this.position.y + gapY),
                    "alpha": this.globalAlpha
                }, `40px ${font} Regular`);

                if (this.selectedIndex === (this.options.length - 1)) {
                    this.bufferedRightColor = new Color.RGB(0, 0, 0);
                } else {
                    if (Utils.isPointInRectangle(this.scene.app.input.mousePos, new Vector2(this.rightX - sideHitboxSize / 2, this.position.y + gapY - sideHitboxSize / 2), 25, 25)) {
                        if (this.scene.app.input.mouseClick) {
                            this.selectedIndex++;
                        }

                        this.bufferedRightColor = new Color.RGB(255, 0, 0);
                        this.scene.app.cursor = "pointer";
                    } else {
                        this.bufferedRightColor = new Color.RGB(255, 255, 255);
                    }
                }
            }
        }
    }
}

class TitleText extends Renderable<TitleScreenScene> {
    public text: string = "";
    public splashText: string = "";

    public elementController: any[];

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

        this.elementController = [];

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
            
            instance.elementController.forEach(element => element.bufferedAlpha = 1);

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
    public publicServerButton!: Button;
    public publicServerGamemodeSelector!: OptionsSelector;
    public privateServerButton!: Button;
    public createServerButton!: Button;
    
    constructor(app: App) {
        super(app, "titleScreen");
    }
    
    public setup(): void {
        this.transitioning = false;

        this.titleText = new TitleText(this);
        
        this.publicServerButton = new Button(this, "public", this.app.center.y);
        this.publicServerButton.onclick = () => {
            this.app.enableScene("lobby");
        };
        
        this.publicServerGamemodeSelector = new OptionsSelector(this, new Vector2(this.app.center.x, this.app.center.y + 30), [
            "Standard",
            "Rush",
            "Testing",
            "TestHelloWorld",
            "Test"
        ]);

        this.privateServerButton = new Button(this, "private", this.app.center.y + 80);
        this.privateServerButton.onclick = () => {
            this.app.enableScene("error");
            this.app.storage.set("error", "Not implemented");
            this.app.storage.set("error_details", "That feature has not been implemented yet");
        }

        this.createServerButton = new Button(this, "create", this.app.center.y + 160);
        this.createServerButton.onclick = () => {
            this.app.enableScene("error");
            this.app.storage.set("error", "Not implemented");
            this.app.storage.set("error_details", "That feature has not been implemented yet");
        }

        this.titleText.elementController.push(this.publicServerButton);
        this.titleText.elementController.push(this.publicServerGamemodeSelector);
        this.titleText.elementController.push(this.privateServerButton);
        this.titleText.elementController.push(this.createServerButton);
        
        GameService.currentRoom = null;
    }

    public loop(): void {
        this.draw(this.titleText);
        this.draw(this.publicServerButton);
        this.draw(this.publicServerGamemodeSelector);
        this.draw(this.privateServerButton);
        this.draw(this.createServerButton)
    }
}