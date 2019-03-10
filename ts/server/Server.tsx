import React from "React";
import { LoginSuccess } from "ts/App";
import { Playlist, getTrackFromPlaylist } from "./object/Playlist";
import ChoosePlaylist from "./ChoosePlaylist";
import JoinRoom from "./JoinRoom";
import Player, { nextPlayerId } from "./object/Player";
import Peer from "peerjs";
import {
  ToServerMessage,
  NotifyGameStarted,
  ToClientMessageType,
  ToServerMessageType
} from "../communication/communication";
import { Track } from "./object/Track";
import { Typography } from "@material-ui/core";
import TrackPlayer from "./TrackPlayer";
import "babel-polyfill";
import SpotifyPlayer from "./player/SpotifyPlayer";

export interface Props {
  loginState: Readonly<LoginSuccess>;
  spotifyPlayer: SpotifyPlayer;
  reportError(message: string): void;
}

const enum StateType {
  ChoosePlaylist,
  PlayerJoin,
  GamePlaying
}

interface ChoosePlaylistState {
  type: StateType.ChoosePlaylist;
  playlist?: Readonly<Playlist>;
  gameState?: never;
}

interface PlayerJoinState {
  type: StateType.PlayerJoin;
  playlist: Readonly<Playlist>;
  players: ReadonlyArray<Readonly<Player>>;
}

interface GameStartedState {
  type: StateType.GamePlaying;
  gameState: Readonly<GameState>;
  playlist: Readonly<Playlist>;
  players: ReadonlyArray<Readonly<Player>>;
}

interface GameState {
  currentTrackNumber: number;
  trackList: ReadonlyArray<number>;
  currentTrack?: Readonly<Track>;
}

type State = ChoosePlaylistState | PlayerJoinState | GameStartedState;

const AMOUNT_OF_TRACKS = 10;

export default class Server extends React.Component<Props, State> {
  public state: State = {
    type: StateType.ChoosePlaylist
  };

  public render(): JSX.Element {
    if (this.state.type === StateType.ChoosePlaylist) {
      // The playlist has not yet been chosen
      return (
        <ChoosePlaylist
          loginState={this.props.loginState}
          reportError={this.props.reportError}
          onPlaylistChosen={(playlist: Playlist) =>
            this.setState(this.onPlaylistChosen(playlist))
          }
        />
      );
    } else if (this.state.type === StateType.PlayerJoin) {
      return (
        <JoinRoom
          players={this.state.players}
          addPlayer={player => this.onNewPlayer(player)}
        />
      );
    } else if (this.state.type === StateType.GamePlaying) {
      const gameState = this.state.gameState;
      if (typeof gameState.currentTrack === "undefined") {
        Server.loadCurrentTrack(this.props, this.state).then(state =>
          this.setState(state)
        );
        return <Typography>Loading...</Typography>;
      } else {
        return (
          <TrackPlayer
            track={gameState.currentTrack}
            spotifyPlayer={this.props.spotifyPlayer}
          />
        );
      }
    } else {
      return <p>Game over!</p>;
    }
  }

  private onPlaylistChosen(playlist: Playlist): PlayerJoinState {
    return {
      type: StateType.PlayerJoin,
      playlist,
      players: []
    };
  }

  /**
   * Handles when a new player joins. Also handles all callback on the connection.
   */
  private onNewPlayer(connection: Peer.DataConnection): void {
    const key = nextPlayerId();
    const player: Player = {
      name: "",
      key,
      connection
    };
    this.setState(state => {
      if (state.type !== StateType.PlayerJoin) {
        console.warn("Players cannot currently join.");
        connection.close();
        return {};
      } else {
        return {
          ...state,
          players: [...state.players, player]
        };
      }
    });
    connection.on("data", (message: ToServerMessage) => {
      switch (message.type) {
        case ToServerMessageType.SetName: {
          this.setState(state => {
            if (state.type !== StateType.PlayerJoin) {
              console.warn("Cannot change name when not joinging");
              return {};
            }
            return {
              ...state,
              players: state.players.map(p => {
                if (p.key === player.key) {
                  return {
                    ...player,
                    name: message.name
                  };
                } else {
                  return p;
                }
              })
            };
          });
          break;
        }
        case ToServerMessageType.StartGame: {
          this.setState(state => Server.startGame(state));
          break;
        }
      }
    });
  }

  private static startGame(state: Readonly<State>): Readonly<State> {
    if (state.type !== StateType.PlayerJoin) {
      console.warn("Can only start game from PlayerJoin");
      return state;
    } else {
      for (const player of state.players) {
        const notifyGameStarted: NotifyGameStarted = {
          type: ToClientMessageType.NotifyGameStarted
        };
        player.connection.send(notifyGameStarted);
      }
      return {
        ...state,
        type: StateType.GamePlaying,
        gameState: {
          currentTrackNumber: 0,
          trackList: Server.generateTrackList(AMOUNT_OF_TRACKS, state.playlist)
        }
      };
    }
  }

  private static generateTrackList(
    amount: number,
    playlist: Readonly<Playlist>
  ): ReadonlyArray<number> {
    const takeFrom = [];
    for (let i = 0; i < playlist.tracks.total; i++) takeFrom.push(i);

    const taken = [];
    for (let i = 0; i < amount; i++)
      taken.push(
        takeFrom.splice(Math.floor(Math.random() * playlist.tracks.total), 1)[0]
      );
    return taken;
  }

  private static async loadCurrentTrack(
    props: Readonly<Props>,
    state: Readonly<GameStartedState>
  ): Promise<Readonly<State>> {
    const trackEither = await getTrackFromPlaylist(
      props.loginState,
      state.playlist,
      state.gameState.trackList[state.gameState.currentTrackNumber]
    );
    if (trackEither.isRight()) {
      return {
        ...state,
        gameState: {
          ...state.gameState,
          currentTrack: trackEither.value
        }
      };
    } else {
      props.reportError("Could not load track");
      return state;
    }
  }
}
