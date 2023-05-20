import { Box3, Mesh, Sphere, Vector3 } from "three";

// Discriminador por tipos de identidad
import Swal from "sweetalert2";
type EntityType = "general" | "player" | "bullet" | "enemy";
import GameScene from "../scene/GameScene";

abstract class GameEntity {
  protected _position: Vector3;
  protected _mesh: Mesh = new Mesh();
  public get mesh() {
    return this._mesh;
  }

  protected _collider?: Box3 | Sphere;
  public get collider() {
    return this._collider;
  }

  protected _entityType: EntityType;
  public get entityType() {
    return this._entityType;
  }

  protected _shouldDispose = false;
  public get shouldDispose() {
    return this._shouldDispose;
  }

  constructor(position: Vector3, entityType: EntityType = "general") {
    this._position = position;
    this._mesh.position.set(
      this._position.x,
      this._position.y,
      this._position.z
    );
    this._entityType = entityType;
  }

  public load = async () => {};
  public update = (_deltaT: number) => {};
  public dispose = () => {};
}

export default GameEntity;
