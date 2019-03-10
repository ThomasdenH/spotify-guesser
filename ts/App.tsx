import * as React from "React";
import Client from "./client/Client";
import Server from "./server/Server";
import * as iots from "io-ts";
import Button from "@material-ui/core/Button";
import { Typography } from "@material-ui/core";
import SpotifyPlayer from "./server/player/SpotifyPlayer";

const CLIENT_ID = "bc5cf5e5acb5401d978dfc4a046ecb40";
const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-birthdate",
  "user-read-email",
  "user-read-private"
].join(" ");

export const loginError = iots.type({
  error: iots.string
});
export interface LoginError extends iots.TypeOf<typeof loginError> {}

export const loginSuccess = iots.type({
  access_token: iots.string,
  token_type: iots.literal("Bearer")
});
export interface LoginSuccess extends iots.TypeOf<typeof loginSuccess> {}

const enum AppMode {
  Client,
  Server,
  Undecided,
  Error
}

interface ClientState {
  mode: AppMode.Client;
}

interface ServerState {
  mode: AppMode.Server;
  player: SpotifyPlayer;
  loginState: LoginSuccess;
}

interface UndecidedState {
  mode: AppMode.Undecided;
}

interface ErrorState {
  mode: AppMode.Error;
  message: string;
}

type State = ClientState | ServerState | UndecidedState | ErrorState;

export default class Game extends React.Component<{}, State> {
  public constructor(props: {}) {
    super(props);
    const loginState = this.decodeLoginState();
    if (typeof loginState === "undefined") {
      this.state = { mode: AppMode.Undecided };
    } else {
      this.state = {
        loginState,
        mode: AppMode.Server,
        player: new SpotifyPlayer(loginState)
      };
    }
  }

  public render(): JSX.Element {
    switch (this.state.mode) {
      case AppMode.Client:
        return (
          <Client
            reportError={(message: string) => this.reportError(message)}
          />
        );
      case AppMode.Server:
        return (
          <Server
            spotifyPlayer={this.state.player}
            loginState={this.state.loginState}
            reportError={(message: string) => this.reportError(message)}
          />
        );
      case AppMode.Undecided:
        return (
          <React.Fragment>
            <Button onClick={() => this.login()}>{"Server"}</Button>
            <Button onClick={() => this.setState({ mode: AppMode.Client })}>
              {"Client"}
            </Button>
          </React.Fragment>
        );
      case AppMode.Error:
        return (
          <React.Fragment>
            <Typography variant="h1">Error!</Typography>
            <Typography variant="body1">{`An error has occurred: ${
              this.state.message
            }`}</Typography>
          </React.Fragment>
        );
    }
  }

  private login(): void {
    const address =
      "https://accounts.spotify.com/authorize?" +
      `client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(window.location.href)}` +
      `&scope=${encodeURIComponent(SPOTIFY_SCOPES)}`;
    window.location.href = address;
  }

  private decodeLoginState(): LoginSuccess | undefined {
    if (window.location.hash.length > 0) {
      const obj: { [key: string]: string } = {};
      for (const [key, value] of window.location.hash
        .substr(1)
        .split("&")
        .map(pair => pair.split("="))) {
        obj[key] = value;
      }

      if (loginSuccess.is(obj)) return obj;
      this.reportError("Could not decode URL");
      return undefined;
    } else if (window.location.search.length > 0) {
      const obj: { [key: string]: string } = {};
      for (const [key, value] of window.location.search
        .substr(1)
        .split("&")
        .map(pair => pair.split("="))) {
        obj[key] = value;
      }
      const message = loginError
        .decode(obj)
        .map(obj => obj.error)
        .getOrElse("Could not decode URL");
      this.reportError(message);
      return undefined;
    } else {
      return undefined;
    }
  }

  private reportError(message: string): void {
    this.setState({
      mode: AppMode.Error,
      message
    });
  }
}
