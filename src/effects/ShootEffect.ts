import { DodecahedronGeometry, Mesh, MeshPhongMaterial, Vector3 } from "three";
import GameEntity from "../entities/GameEntity";
import { randomIntInRange, randomSign } from "../utils/MathUtils";

class ShootEffect extends GameEntity {
  private _angle: number;
  private _fire = new Mesh();
  private _size = 0.12;
  private _effectDuration = 0.8; //duracion del humo

  constructor(position: Vector3, angle: number) {
    super(position);
    this._angle = angle;
  }

  public load = async () => {
    console.log(" La bala fue creada");

    const particleGeometry = new DodecahedronGeometry(this._size, 0);

    const fireMaterial = new MeshPhongMaterial({ color: 0xfafafa });

    //creamos las particulas random
    const totalParticles = randomIntInRange(4, 9);
    for (let i = 0; i < totalParticles; i++) {
      const angleOffest = Math.PI * 0.08 * Math.random() * randomSign();
      const particleSpeed = 1.75 * Math.random() * 3;

      const fireParticle = new Mesh(particleGeometry, fireMaterial);
      fireParticle.userData = {
        angle: this._angle + angleOffest,
        speed: particleSpeed,
      };
      this._fire.add(fireParticle);
    }

    this._mesh.add(this._fire);
  };
  public reset = () => {
    this._fire.children.forEach((element) => {
      (element as Mesh).geometry.dispose();
      ((element as Mesh).material as MeshPhongMaterial).dispose();
      this._fire.remove(element);
    });
    this._fire = new Mesh();
    this._effectDuration = 0.8;
    this.load();
  };

  public update = (deltaT: number) => {
    this._effectDuration -= deltaT;
    if (this._effectDuration <= 0) {
      this._shouldDispose = true;
      return;
    }

    this._fire.children.forEach((element) => {
      const fireParticle = element as Mesh;
      const angle = fireParticle.userData["angle"];
      const speed = fireParticle.userData["speed"];
      const computedMovement = new Vector3(
        speed * Math.sin(angle) * deltaT * this._effectDuration * 0.75,
        -speed * Math.cos(angle) * deltaT * this._effectDuration * 0.75
      );
      fireParticle.position.add(computedMovement);
      fireParticle.scale.set(
        (fireParticle.scale.x = this._effectDuration),
        (fireParticle.scale.y = this._effectDuration),
        (fireParticle.scale.z = this._effectDuration)
      );
    });
  };

  public dispose = () => {
    console.log(" la bala fue destruida");

    this._fire.children.forEach((element) => {
      (element as Mesh).geometry.dispose();
      ((element as Mesh).material as MeshPhongMaterial).dispose();
      this._fire.remove(element);
    });

    this._mesh.remove(this._fire);
  };
}

export default ShootEffect;
