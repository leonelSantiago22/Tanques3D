import {
  Box3,
  Mesh,
  MeshStandardMaterial,
  Sphere,
  Vector3,
  Material,
} from "three";
import GameEntity from "./GameEntity";
import ResourceManager from "../utils/ResourceManager";
import GameScene from "../scene/GameScene";
import Bullet from "./Bullet";
import ShootEffect from "../effects/ShootEffect";
import SoundEfect from "../effects/sound";
import ExplosionEffect from "../effects/ExplosionEffect";

import Swal from "sweetalert2";

type KeyboardState = {
  LeftPressed: boolean;
  RightPressed: boolean;
  UpPressed: boolean;
  DownPressed: boolean;
};

class PlayerTank extends GameEntity {
  private _life = 100;
  private _rotation: number = 0;
  AudioPlay = new SoundEfect();

  private _keyboardState: KeyboardState = {
    LeftPressed: false,
    RightPressed: false,
    UpPressed: false,
    DownPressed: false,
  };

  constructor(position: Vector3) {
    super(position, "enemy");
    //this.removeshoot();
    //this.clear();
    //revisamos los estados de las teclas, para ver cuando la aprieta y cuando la deja de apretar
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        this._keyboardState.UpPressed = true;
        break;
      case "ArrowDown":
        this._keyboardState.DownPressed = true;
        break;
      case "ArrowLeft":
        this._keyboardState.LeftPressed = true;
        break;
      case "ArrowRight":
        this._keyboardState.RightPressed = true;
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
  private handleKeyUp = async (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        this._keyboardState.UpPressed = false;
        break;
      case "ArrowDown":
        this._keyboardState.DownPressed = false;
        break;
      case "ArrowLeft":
        this._keyboardState.LeftPressed = false;
        break;
      case "ArrowRight":
        this._keyboardState.RightPressed = false;
        break;
      case " ":
        await this.shoot();
        break;
      default:
        break;
    }
  };

  private shoot = async () => {
    const offset = new Vector3(
      Math.sin(this._rotation) * 0.55,
      -Math.cos(this._rotation) * 0.75,
      0.5
    );
    const shootingPosition = this._mesh.position.clone().add(offset);
    const bullet = new Bullet(shootingPosition, this._rotation);
    await bullet.load();

    const shootEffect = new ShootEffect(shootingPosition, this._rotation);
    await shootEffect.load();

    GameScene.instance.addToScene(shootEffect);
    GameScene.instance.addToScene(bullet);
  };
  private removeshoot = async () => {
    const offset = new Vector3(
      Math.sin(this._rotation) * 0.5,
      -Math.cos(this._rotation) * 0.55,
      0.5
    );
    const shootingPosition = this._mesh.position.clone().add(offset);
    const bullet = new Bullet(shootingPosition, this._rotation);
    await bullet.load();

    const shootEffect = new ShootEffect(shootingPosition, this._rotation);
    shootEffect.reset();

    GameScene.instance.removeFromScene(shootEffect);
    GameScene.instance.removeFromScene(bullet);
  };

  public load = async () => {
    const tankModel = ResourceManager.instance.getModel("tank");
    if (!tankModel) {
      throw "unable to get tank model";
    }
    const tankSceneData = tankModel.scene.clone();
    const tankBodyMesh = tankSceneData.children.find(
      (m) => m.name === "Body"
    ) as Mesh;

    const tankTurretMesh = tankSceneData.children.find(
      (m) => m.name === "Turret"
    ) as Mesh;

    const tankBodyTexture = ResourceManager.instance.getTexture("tank-body");
    const tankTurretTexture =
      ResourceManager.instance.getTexture("tank-turret");

    if (
      !tankBodyMesh ||
      !tankTurretMesh ||
      !tankBodyTexture ||
      !tankTurretTexture
    ) {
      throw "No se encontraban las texturas del juego";
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

    const collider = new Box3()
      .setFromObject(this._mesh)
      .getBoundingSphere(new Sphere(this._mesh.position.clone()));
    //creamos un radio en el cual el tanque puede llegar a ser afectado
    collider.radius *= 0.75;
    this._collider = collider;
  };

  public damage = async (amount: number) => {
    this._life -= amount;
    if (this._life <= 0) {
      this.disposeTrue();
      this.AudioPlay.explosionSound();
      const explosion = new ExplosionEffect(this._mesh.position, 2);
      explosion.load().then(() => {
        GameScene.instance.addToScene(explosion);
      });
      this.clear();
      //console.log("Tanque eliminado");
      //console.log("El tanque rojo");
      GameScene.instance.resetGame("Verde");
    }
  };
  public disposeTrue() {
    this._shouldDispose = true;
  }

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

    if (this._keyboardState.LeftPressed) {
      computedRotation += Math.PI * deltaT;
    } else if (this._keyboardState.RightPressed) {
      computedRotation -= Math.PI * deltaT;
    }
    //mantenemos la rotacion del tanque
    const fullCircle = Math.PI * 2;
    if (computedRotation > fullCircle) {
      computedRotation = fullCircle - computedRotation;
    } else if (computedRotation < 0) {
      computedRotation = fullCircle + computedRotation;
    }

    const yMovement = moveSpeed * deltaT * Math.cos(computedRotation);
    const xMovement = moveSpeed * deltaT * Math.sin(computedRotation);
    if (this._keyboardState.UpPressed) {
      computedMovement = new Vector3(xMovement, -yMovement, 0);
    } else if (this._keyboardState.DownPressed) {
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

    const colliders = GameScene.instance.gameEntities.filter(
      (c) =>
        c !== this &&
        c.collider &&
        c.collider!.intersectsSphere(testingSphere) &&
        c.entityType !== "bullet"
    );

    if (colliders.length) {
      return;
    }

    this._mesh.position.add(computedMovement);
    (this._collider as Sphere).center.add(computedMovement);
    this._mesh.setRotationFromAxisAngle(new Vector3(0, 0, 1), this._rotation);
  };
}

export default PlayerTank;
