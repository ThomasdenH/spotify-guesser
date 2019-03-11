import { LoginSuccess } from "../../App";
import { Track } from "../object/Track";
import "babel-polyfill";
import { DeepReadonly } from "../../util";

export default class SpotifyPlayer {
  private readonly loginSuccess: Readonly<LoginSuccess>;
  private deviceId?: string;
  private player?: Spotify.SpotifyPlayer;
  private currentlyPlaying?: DeepReadonly<Track>;
  public constructor(loginSuccess: LoginSuccess) {
    this.loginSuccess = loginSuccess;
    window.onSpotifyWebPlaybackSDKReady = () => {
      this.player = new Spotify.Player({
        name: "Spotify Guesser",
        getOAuthToken: cb => cb(loginSuccess.access_token)
      });

      // Error handling
      this.player.addListener("initialization_error", ({ message }) => {
        console.error(message);
      });
      this.player.addListener("authentication_error", ({ message }) => {
        console.error(message);
      });
      this.player.addListener("account_error", ({ message }) => {
        console.error(message);
      });
      this.player.addListener("playback_error", ({ message }) => {
        console.error(message);
      });

      // Playback status updates
      this.player.addListener("player_state_changed", state => {
        console.log(state);
      });

      // Ready
      this.player.addListener("ready", ({ device_id }) => {
        this.deviceId = device_id;
      });

      // Not Ready
      this.player.addListener("not_ready", () => {
        this.deviceId = undefined;
      });

      // Connect to the player!
      this.player.connect();
    };
  }

  public async play(track: DeepReadonly<Track>): Promise<void> {
    if (typeof this.deviceId === "undefined")
      throw new Error("Player not initialized");
    if (
      typeof this.currentlyPlaying !== "undefined" &&
      this.currentlyPlaying.id === track.id
    )
      return;
    this.currentlyPlaying = track;
    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
      {
        method: "PUT",
        body: JSON.stringify({ uris: [track.uri] }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.loginSuccess.access_token}`
        }
      }
    );
  }

  public async pause(): Promise<void> {
    if (typeof this.player === "undefined")
      throw new Error("Player not initialized");
    await this.player.pause();
  }
}
