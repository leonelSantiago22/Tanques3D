import {
  Clock,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import GameEntity from "../entities/GameEntity";
import GameMap from "../map/GameMap";
import ResourceManager from "../utils/ResourceManager";
import PlayerTank from "../entities/PlayerTank";
import Wall from "../map/Wall";
import Swal from "sweetalert2";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import EnemyTank from "../entities/EnemyTank";

class GameScene {
  private static _instance = new GameScene();
  public static get instance() {
    return this._instance;
  }
  private _width: number;
  private _height: number;
  private _renderer: WebGLRenderer;
  private _camera: PerspectiveCamera;

  // three js scene
  private readonly _scene = new Scene();

  // game entities array
  private _gameEntities: GameEntity[] = [];

  private _clock: Clock = new Clock();

  // map size
  private _mapSize = 12;

  // expose the camera
  public get camera() {
    return this._camera;
  }

  // expose current entities
  public get gameEntities() {
    return this._gameEntities;
  }
  public delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public resetGame = async (winner: any) => {
    console.log(GameEntity);

    await this.delay(2000);
    Swal.fire({
      position: "center",
      icon: "error",
      title: "El tanque" + winner + "El el ganador",
      showConfirmButton: true,
    });
    await this.delay(2000); // Espera 2 segundos
    GameScene.instance.clear();
    await GameScene.instance.load();
    GameScene.instance.render();
    console.log(GameEntity);
  };
  private constructor() {
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    const aspectRatio = this._width / this._height;
    this._camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    this.createAllGame();
  }

  private createAllGame = async () => {
    this._width = window.innerWidth;
    this._height = window.innerHeight;

    this._renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(this._width, this._height);
    // find the target html element
    const targetElement = document.querySelector<HTMLDivElement>("#app");
    if (!targetElement) {
      throw "unable to find target element";
    }
    targetElement.appendChild(this._renderer.domElement);
    // setup camera
    const aspectRatio = this._width / this._height;
    this._camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    this._camera.position.set(4, 5.2, 15);

    window.addEventListener("resize", this.resize, false);

    //agregamos el tanque rojo
    const gameMap = new GameMap(new Vector3(0, 0, 0), this._mapSize);
    this._gameEntities.push(gameMap);

    //agregamos el tanque verde
    const playerTank = new PlayerTank(new Vector3(7, 7, 0));
    this._gameEntities.push(playerTank);

    const enemyTank = new EnemyTank(new Vector3(3, 3, 0));
    this._gameEntities.push(enemyTank);

    // Controles
    //const controls = new OrbitControls(this._camera, targetElement);
    //controls.enableDamping = true;

    this.createWalls();
  };
  private createWalls = () => {
    const edge = this._mapSize - 1;

    this._gameEntities.push(new Wall(new Vector3(0, 0, 0)));
    this._gameEntities.push(new Wall(new Vector3(edge, 0, 0)));
    this._gameEntities.push(new Wall(new Vector3(edge, edge, 0)));
    this._gameEntities.push(new Wall(new Vector3(0, edge, 0)));
    for (let i = 1; i < edge; i++) {
      this._gameEntities.push(new Wall(new Vector3(i, 0, 0)));
      this._gameEntities.push(new Wall(new Vector3(0, i, 0)));
      this._gameEntities.push(new Wall(new Vector3(edge, i, 0)));
      this._gameEntities.push(new Wall(new Vector3(i, edge, 0)));
    }
  };

  private resize = () => {
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._renderer.setSize(this._width, this._height);
    this._camera.aspect = this._width / this._height;
    this._camera.updateProjectionMatrix();
  };

  public load = async () => {
    await ResourceManager.instance.load();
    for (let index = 0; index < this._gameEntities.length; index++) {
      const element = this._gameEntities[index];
      await element.load();
      this._scene.add(element.mesh);
    }
    //agregamos la luz a la escena
    const light = new HemisphereLight(0xffffbb, 0x080820, 1);
    this._scene.add(light);
  };
  public reset = async () => {
    // Limpiar la escena
    this._scene.clear();
    console.log("Escene: ", this._scene);

    // Borrar la matriz de entidades de juego
    this._gameEntities = [];

    // Crear las entidades de juego y los muros
    const gameMap = new GameMap(new Vector3(0, 0, 0), this._mapSize);
    this._gameEntities.push(gameMap);

    const playerTank = new PlayerTank(new Vector3(7, 7, 0));
    this._gameEntities.push(playerTank);

    const enemyTank = new EnemyTank(new Vector3(3, 3, 0));
    this._gameEntities.push(enemyTank);

    this.createWalls();

    // Cargar los recursos y añadir las entidades de juego a la escena
    await ResourceManager.instance.load();
    for (let index = 0; index < this._gameEntities.length; index++) {
      const element = this._gameEntities[index];
      await element.load();
      this._scene.add(element.mesh);
    }
  };
  public clear = () => {
    this.reset();
  };
  public render = () => {
    requestAnimationFrame(this.render);
    this.disposeEntities();
    const deltaT = this._clock.getDelta();
    for (let index = 0; index < this._gameEntities.length; index++) {
      const element = this._gameEntities[index];
      element.update(deltaT); /// ????
    }
    this._renderer.render(this._scene, this._camera);
  };

  public addToScene = (entity: GameEntity) => {
    this._gameEntities.push(entity);
    this._scene.add(entity.mesh);
  };
  public removeFromScene = (entity: GameEntity) => {
    const index = this._gameEntities.indexOf(entity);
    if (index !== -1) {
      console.log("Entidad: ", entity);

      this._gameEntities.splice(index, 1);
      this._scene.remove(entity.mesh);
    }
  };

  private disposeEntities = () => {
    const entitiesToBeDisposed = this._gameEntities.filter(
      (e) => e.shouldDispose
    );
    entitiesToBeDisposed.forEach((element) => {
      this._scene.remove(element.mesh);
      element.dispose();
    });
    this._gameEntities = [
      ...this._gameEntities.filter((e) => !e.shouldDispose),
    ];
  };
}

export default GameScene;
