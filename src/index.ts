import { GameService } from "./game";
import App from "./lib/App";
import ErrorScene from "./Scenes/Error";
import GameScene from "./Scenes/Game";
import LobbyScene from "./Scenes/PublicLobby";
import TitleScreenScene from "./Scenes/TitleScreen";

let app: App;

$(function() {
    app = new App(window.innerWidth, window.innerHeight);

    GameService.app = app;
    
    app.addScene(new ErrorScene(app));
    app.addScene(new TitleScreenScene(app));
    app.addScene(new LobbyScene(app));
    app.addScene(new GameScene(app));

    app.enableScene("titleScreen");
});

$(window).on("resize", function() {
    app.width = window.innerWidth;
    app.height = window.innerHeight;
});