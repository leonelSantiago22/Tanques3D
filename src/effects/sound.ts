import GameEntity from "../entities/GameEntity";
class SoundEfect {
  private _audio: HTMLAudioElement;
  private _audioImpact: HTMLAudioElement;
  private _audioExplosion: HTMLAudioElement;
  constructor() {
    this._audio = new Audio("../../public/sounds/10918 (mp3cut.net).mp3");
    this._audioImpact = new Audio(
      "../../public/sounds/11114 (1) (mp3cut.net).mp3"
    );
    this._audioExplosion = new Audio(
      "../../public/sounds/11119 (mp3cut.net).mp3"
    );
  }
  public load = () => {
    this._audio.currentTime = 0;
  };
  public bulletSound = () => {
    this._audio.play();
  };

  public impactSount = () => {
    this._audioImpact.play();
  };
  public explosionSound = () => {
    this._audioExplosion.play();
  };
}
export default SoundEfect;
//clase de efectos de sonido
