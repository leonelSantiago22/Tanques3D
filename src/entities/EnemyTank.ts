import {
  Box3,
  Material,
  Mesh,
  MeshStandardMaterial,
  Sphere,
  Vector3,
} from "three";
import GameEntity from "./GameEntity";
import ResourceManager from "../utils/ResourceManager";
import GameScene from "../scene/GameScene";
import Bullet from "./Bullet";
import ShootEffect from "../effects/ShootEffect";
import ExplosionEffect from "../effects/ExplosionEffect";
import Swal from "sweetalert2";
import SoundEfect from "../effects/sound";
import PlayerTank from "./PlayerTank";
type KeyboardState = {
  aPressed: boolean;
  dPressed: boolean;
  wPressed: boolean;
  sPressed: boolean;
};

class EnemyTank extends GameEntity {
  private _life = 100;
  private _rotation: number = 0;
  AudioPlay = new SoundEfect();

  private _keyboardState: KeyboardState = {
    aPressed: false,
    dPressed: false,
    wPressed: false,
    sPressed: false,
  };

  constructor(position: Vector3) {
    super(position, "enemy");
    window.addEventListener("keydown", this.handleKeyDown); //se dispara cuando se presiona una tecla
    window.addEventListener("keyup", this.handleKeyUp); //se dispara cuando se deja de presionar la tecla
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "w":
        this._keyboardState.wPressed = true;
        break;
      case "s":
        this._keyboardState.sPressed = true;
        break;
      case "a":
        this._keyboardState.aPressed = true;
        break;
      case "d":
        this._keyboardState.dPressed = true;
        break;
      default:
        break;
    }
  };

  private handleKeyUp = async (e: KeyboardEvent) => {
    switch (e.key) {
      case "w":
        this._keyboardState.wPressed = false;
        break;
      case "s":
        this._keyboardState.sPressed = false;
        break;
      case "a":
        this._keyboardState.aPressed = false;
        break;
      case "d":
        this._keyboardState.dPressed = false;
        break;
      case "t":
        await this.shoot();
        break;
      default:
        break;
    }
  };

  public clear = () => {
    // Eliminar los listeners de eventos de teclado
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  };
  private shoot = async () => {
    console.log(" Se creo el disparo");

    const offset = new Vector3(
      Math.sin(this._rotation) * 0.55,
      -Math.cos(this._rotation) * 0.75,
      0.5
    );
    const shootingPosition = this._mesh.position.clone().add(offset); //esta es el problema, se guarda una posicion de disparo lo que no debe pasar
    const bullet = new Bullet(shootingPosition, this._rotation);
    await bullet.load();

    const shootEffect = new ShootEffect(shootingPosition, this._rotation);
    await shootEffect.load();

    GameScene.instance.addToScene(shootEffect);
    GameScene.instance.addToScene(bullet);
  };

  public load = async () => {
    //preguntamos si encontramos los modelos de las particulas
    const tankModel = ResourceManager.instance.getModel("tank");
    if (!tankModel) {
      throw "No se pudo encontrar el modelo";
    }

    const tankSceneData = tankModel.scene.clone();

    const tankBodyMesh = tankSceneData.children.find(
      (m) => m.name === "Body"
    ) as Mesh;

    const tankTurretMesh = tankSceneData.children.find(
      (m) => m.name === "Turret"
    ) as Mesh;

    const tankBodyTexture =
      ResourceManager.instance.getTexture("tank-body-red");
    const tankTurretTexture =
      ResourceManager.instance.getTexture("tank-turret-red");

    if (
      !tankBodyMesh ||
      !tankTurretMesh ||
      !tankBodyTexture ||
      !tankTurretTexture
    ) {
      throw "unable to load player model or textures";
    }
    const bodyMaterial = new MeshStandardMaterial({
      map: tankBodyTexture,
    });
    const turretMaterial = new MeshStandardMaterial({
      map: tankTurretTexture,
    });

    tankBodyMesh.material = bodyMaterial;
    tankTurretMesh.material = turretMaterial;
    this._mesh.add(tankBodyMesh);
    this._mesh.add(tankTurretMesh);

    //Creamos la capa que se puede detectar como colision del tanque
    const collider = new Box3()
      .setFromObject(this._mesh)
      .getBoundingSphere(new Sphere(this._mesh.position.clone()));
    //la colicion se va a detectar en este radio
    collider.radius *= 0.75;
    this._collider = collider;
  };
  public damage = async (amount: number) => {
    this._life -= amount;
    if (this._life <= 0) {
      //la vida del tanque es menor que cero
      console.log("Tanque eliminado");
      this._shouldDispose = true; //esta variable es lo que hace que desaprezca, al no desaparecer el problema no se soluciona desde el tanque enemigo
      this.AudioPlay.explosionSound();
      // mandamos a llamar la explosion del tanque
      //this.clear(); //in9tento de borrar el doble canon
      this.activate_flag();
      const explosion = new ExplosionEffect(this._mesh.position, 2);
      explosion.load().then(() => {
        GameScene.instance.addToScene(explosion);
      });

      //llamamos a la instancia que reinicia el juego en caso de que pierda
      GameScene.instance.resetGame("Rojo");
    }
  };
  public delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  public dispose = () => {
    this._mesh.children.forEach((c) => {
      (c as Mesh).geometry.dispose();
      ((c as Mesh).material as Material).dispose();
      this._mesh.remove(c);
    });
  };
  public update = (deltaT: number) => {
    let computedRotation = this._rotation;
    let computedMovement = new Vector3();
    const moveSpeed = 2; //velocidad de movimiento

    if (this._keyboardState.aPressed) {
      computedRotation += Math.PI * deltaT;
    } else if (this._keyboardState.dPressed) {
      computedRotation -= Math.PI * deltaT;
    }

    const fullCircle = Math.PI * 2;
    if (computedRotation > fullCircle) {
      computedRotation = fullCircle - computedRotation;
    } else if (computedRotation < 0) {
      computedRotation = fullCircle + computedRotation;
    }

    const yMovement = moveSpeed * deltaT * Math.cos(computedRotation);
    const xMovement = moveSpeed * deltaT * Math.sin(computedRotation);
    if (this._keyboardState.wPressed) {
      computedMovement = new Vector3(xMovement, -yMovement, 0);
    } else if (this._keyboardState.sPressed) {
      computedMovement = new Vector3(-xMovement, yMovement, 0);
    }

    this._rotation = computedRotation;
    this._mesh.setRotationFromAxisAngle(new Vector3(0, 0, 1), computedRotation);
    //hasta a qui termina lo del movimiento
    const testingSphere = new Sphere(
      (this._collider as Sphere).clone().center,
      (this._collider as Sphere).clone().radius
    );
    testingSphere.center.add(computedMovement);

    //Se busca por posibles colisiones
    const colliders = GameScene.instance.gameEntities.filter(
      (c) =>
        c !== this &&
        c.collider &&
        c.collider!.intersectsSphere(testingSphere) &&
        c.entityType !== "bullet"
    );

    if (colliders.length) {
      //detiene cuando algo esta enfrente
      return;
    }

    this._mesh.position.add(computedMovement);

    (this._collider as Sphere).center.add(computedMovement);
    this._mesh.setRotationFromAxisAngle(new Vector3(0, 0, 1), this._rotation);
  };
}

export default EnemyTank;
