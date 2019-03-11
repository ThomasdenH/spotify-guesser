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
  ToServerMessageType,
  SendQuestion,
  AnswerResult,
  AnswerQuestion,
  SetName
} from "../communication/communication";
import { Track } from "./object/Track";
import { Typography, Grid } from "@material-ui/core";
import TrackPlayer from "./TrackPlayer";
import "babel-polyfill";
import SpotifyPlayer from "./player/SpotifyPlayer";
import {
  getArtistQuizQuestion,
  QuizQuestionWithAnswer,
  getSongQuizQuestion
} from "./object/QuizQuestion";
import { DeepReadonly } from "../util";
import PlayerInfo from "./PlayerInfo";
import { getQuestionPoints } from "../shared/questionUtil";

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
  question?: DeepReadonly<QuizQuestionWithAnswer>;
  questionSentAt?: Date;
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
        Server.loadCurrentQuestion(this.props, this.state).then(state =>
          this.setState(state)
        );
        return <Typography>Loading...</Typography>;
      } else {
        return (
          <React.Fragment>
            <Grid>
              {this.state.players.map(player => {
                return <PlayerInfo player={player} key={player.key} />;
              })}
            </Grid>
            <TrackPlayer
              track={gameState.currentTrack}
              spotifyPlayer={this.props.spotifyPlayer}
            />
          </React.Fragment>
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
    this.setState(state => Server.addPlayer(state, key, connection));
    connection.on("data", (message: ToServerMessage) => {
      switch (message.type) {
        case ToServerMessageType.SetName:
          return this.setState(state => Server.setName(state, key, message));
        case ToServerMessageType.StartGame:
          return this.setState(state => Server.startGame(state));
        case ToServerMessageType.AnswerQuestion:
          return this.setState(state => Server.answerQuestion(state, key, message, connection));
      }
    });
  }

  private static addPlayer(state: DeepReadonly<State>, key: number, connection: Peer.DataConnection): DeepReadonly<State> {
    if (state.type !== StateType.PlayerJoin) {
      console.warn("Players cannot currently join.");
      connection.close();
      return state;
    } else {
      return {
        ...state,
        players: [...state.players, {
          name: "",
          key,
          connection,
          score: 0
        }]
      };
    }
  }

  private static setName(state: DeepReadonly<State>, playerKey: number, message: SetName): DeepReadonly<State> {
    if (state.type !== StateType.PlayerJoin) {
      console.warn("Cannot change name when not joining");
      return state;
    }
    return Server.updatePlayer(state, playerKey, player => ({
      ...player,
      name: message.name
    }));
  }

  /**
   * Called when a player answers a question.
   */
  private static answerQuestion(state: DeepReadonly<State>, playerKey: number, message: AnswerQuestion, connection: Peer.DataConnection): DeepReadonly<State> {
    if (
      state.type !== StateType.GamePlaying ||
      typeof state.gameState.question === "undefined" ||
      typeof state.gameState.questionSentAt === "undefined"
    ) {
      console.warn("Cannot answer question now");
      return state;
    }
    const questionAnsweredAt = new Date();
    let scoreIncrement: number;
    const isCorrect =
      state.gameState.question.correct === message.answer;
    if (isCorrect) {
      // Question answered correct
      scoreIncrement = getQuestionPoints(
        state.gameState.questionSentAt,
        questionAnsweredAt
      );
    } else {
      scoreIncrement = 0;
    }
    state = Server.updatePlayer(state, playerKey, player => ({
      ...player,
      score: player.score + scoreIncrement,
      lastAnswer: {
        scoreIncrement,
        isCorrect
      }
    }));
    // Notify the player of the correct answer
    const answerResult: AnswerResult = {
      type: ToClientMessageType.AnswerResult,
      answered: message.answer,
      correctAnswer: state.gameState.question.correct,
      scoreIncrement
    };
    connection.send(answerResult);
    return state;
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

  private static async loadCurrentQuestion(
    props: Readonly<Props>,
    state: Readonly<GameStartedState>
  ): Promise<Readonly<State>> {
    const trackEither = await getTrackFromPlaylist(
      props.loginState,
      state.playlist,
      state.gameState.trackList[state.gameState.currentTrackNumber]
    );
    if (trackEither.isRight()) {
      const random = Math.random();
      const question =
        random < 0.7
          ? await getSongQuizQuestion(props.loginState, trackEither.value)
          : await getArtistQuizQuestion(props.loginState, trackEither.value);
      if (typeof question === "undefined") {
        props.reportError("Could not generate question");
        return state;
      }
      for (const player of state.players) {
        const sendQuestion: SendQuestion = {
          type: ToClientMessageType.SendQuestion,
          question
        };
        player.connection.send(sendQuestion);
      }
      const questionSentAt = new Date();
      return {
        ...state,
        gameState: {
          ...state.gameState,
          currentTrack: trackEither.value,
          question,
          questionSentAt
        }
      };
    } else {
      props.reportError("Could not load track");
      return state;
    }
  }

  private static updatePlayer(state: DeepReadonly<State>, key: number, playerUpdate: (player: DeepReadonly<Player>) => DeepReadonly<Player>): DeepReadonly<State> {
    if (state.type !== StateType.PlayerJoin && state.type !== StateType.GamePlaying)
      throw new Error("Players not defined");
    return {
      ...state,
      players: state.players.map(p => {
        if (p.key === key) {
          return playerUpdate(p);
        } else {
          return p;
        }
      })
    };
  }

  private static allPlayersAnswered(state: DeepReadonly<State>): boolean {
    if (state.type !== StateType.GamePlaying)
      throw new Error('Function should only be called while playing');
    return state.players.every(player => typeof player.lastAnswer !== 'undefined');
  }
}
