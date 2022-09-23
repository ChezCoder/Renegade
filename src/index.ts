import { ClientPlayer, GameService } from "./game";
import App from "./lib/App";
import ErrorScene from "./Scenes/Error";
import GameScene from "./Scenes/Game";
import LobbyScene from "./Scenes/PublicLobby";
import TitleScreenScene from "./Scenes/TitleScreen";

let app: App;

$(function() {
    app = new App(window.innerWidth, window.innerHeight);
    app.storage.set("upward_keybind", "w");
    app.storage.set("leftward_keybind", "a");
    app.storage.set("downward_keybind", "s");
    app.storage.set("rightward_keybind", "d");

    GameService.app = app;
    
    app.addScene(new ErrorScene(app));
    app.addScene(new TitleScreenScene(app));
    app.addScene(new LobbyScene(app));
    app.addScene(new GameScene(app));
    
    GameService.clientPlayer = new ClientPlayer(0, "Test");
    
    app.enableScene("titleScreen");
});

$(window).on("resize", function() {
    app.width = window.innerWidth;
    app.height = window.innerHeight;
});