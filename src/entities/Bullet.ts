import {
  Box3,
  Material,
  Mesh,
  MeshPhongMaterial,
  Sphere,
  SphereGeometry,
  Vector3,
} from "three";
import GameEntity from "./GameEntity";
import GameScene from "../scene/GameScene";
import ExplosionEffect from "../effects/ExplosionEffect";
import EnemyTank from "./EnemyTank";
import SoundEfect from "../effects/sound";
import Wall from "../map/Wall";

class Bullet extends GameEntity {
  private _angle: number;
  AudioPlay = new SoundEfect();

  constructor(position: Vector3, angle: number) {
    super(position, "bullet");
    this._angle = angle;
  }

  public load = async () => {
    const bulletGeometry = new SphereGeometry(0.085);
    const bulletMaterial = new MeshPhongMaterial({ color: 0x262626 });
    //creamos la bala
    this._mesh = new Mesh(bulletGeometry, bulletMaterial);
    this._mesh.position.set(
      this._position.x,
      this._position.y,
      this._position.z
    );

    //creamos los metodos de colision
    this._collider = new Box3()
      .setFromObject(this._mesh)
      .getBoundingSphere(new Sphere(this._mesh.position));
  };

  public update = (deltaT: number) => {
    const travelSpeed = 8;

    this.AudioPlay.bulletSound();
    //this._audio.play();
    const computedMovement = new Vector3(
      travelSpeed * Math.sin(this._angle) * deltaT,
      -travelSpeed * Math.cos(this._angle) * deltaT,
      0
    );
    //creamos la bola como un elemento colicion
    this._mesh.position.add(computedMovement);

    // librar al jugador de las colisiones
    const colliders = GameScene.instance.gameEntities.filter(
      (c) =>
        c.collider &&
        c !== this &&
        c.entityType !== "player" &&
        c.collider.intersectsSphere(this._collider as Sphere)
    );

    if (colliders.length) {
      this._shouldDispose = true;
      const explosion = new ExplosionEffect(this._mesh.position, 1);
      explosion.load().then(() => {
        GameScene.instance.addToScene(explosion);
      });
      const enemies = colliders.filter((c) => c.entityType === "enemy");

      if (enemies.length) {
        (enemies[0] as EnemyTank).damage(25);
        // Reproduce el sonido cuando la bola colisiona con un enemigo
        this.AudioPlay.impactSount();
      }
    }
  };
  public checkCollisionWith(otherMesh: any) {
    // librar al jugador de las colisiones
    const colliders = GameScene.instance.gameEntities.filter(
      (c) =>
        c.collider &&
        c !== this &&
        c.entityType !== "player" &&
        c.collider.intersectsSphere(this._collider as Sphere)
    );
  }
  public dispose = () => {
    (this._mesh.material as Material).dispose();
    this._mesh.geometry.dispose();
  };
}

export default Bullet;
