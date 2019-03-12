import React from "react";
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
  SetName,
  AllAnswersGiven
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
  GamePlaying,
  GameOver
}

interface ChoosePlaylistState {
  type: StateType.ChoosePlaylist;
  playlist?: Readonly<Playlist>;
  gameState?: never;
}

interface PlayerJoinState {
  type: StateType.PlayerJoin;
  playlist: Readonly<Playlist>;
  players: DeepReadonly<Player[]>;
}

interface GameStartedState {
  type: StateType.GamePlaying;
  gameState: Readonly<GameState>;
  playlist: Readonly<Playlist>;
  players: DeepReadonly<Player[]>;
}

interface GameState {
  currentTrackNumber: number;
  trackList: ReadonlyArray<number>;
  currentTrack?: Readonly<Track>;
  question?: DeepReadonly<QuizQuestionWithAnswer>;
  questionSentAt?: Date;
}

interface GameOverState {
  type: StateType.GameOver;
  players: DeepReadonly<Player[]>;
}

type State =
  | ChoosePlaylistState
  | PlayerJoinState
  | GameStartedState
  | GameOverState;

const AMOUNT_OF_TRACKS = 10;

export default class Server extends React.Component<
  DeepReadonly<Props>,
  DeepReadonly<State>
> {
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
            this.setState(Server.onPlaylistChosen(playlist))
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
              {this.state.players.map(player => (
                <PlayerInfo player={player} key={player.key} />
              ))}
            </Grid>
            <TrackPlayer
              track={gameState.currentTrack}
              spotifyPlayer={this.props.spotifyPlayer}
              showInfo={Server.allPlayersAnswered(this.state)}
            />
          </React.Fragment>
        );
      }
    } else {
      return (
        <React.Fragment>
          <Typography variant="h1">Game over!</Typography>
          <Grid>
            {this.state.players.map(player => (
              <PlayerInfo player={player} key={player.key} />
            ))}
          </Grid>
        </React.Fragment>
      );
    }
  }

  private static onPlaylistChosen(playlist: Playlist): PlayerJoinState {
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
          return this.setState(state =>
            Server.answerQuestion(state, key, message, connection)
          );
        case ToServerMessageType.NextQuestion:
          return this.setState(state => Server.nextQuestion(state));
      }
    });
  }

  private static addPlayer(
    state: DeepReadonly<State>,
    key: number,
    connection: Peer.DataConnection
  ): DeepReadonly<State> {
    if (state.type !== StateType.PlayerJoin) {
      console.warn("Players cannot currently join.");
      connection.close();
      return state;
    } else {
      return {
        ...state,
        players: [
          ...state.players,
          {
            name: "",
            key,
            connection,
            score: 0
          }
        ]
      };
    }
  }

  private static setName(
    state: DeepReadonly<State>,
    playerKey: number,
    message: SetName
  ): DeepReadonly<State> {
    if (state.type !== StateType.PlayerJoin) {
      console.warn("Can only change name while joining");
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
  private static answerQuestion(
    state: DeepReadonly<State>,
    playerKey: number,
    message: AnswerQuestion,
    connection: Peer.DataConnection
  ): DeepReadonly<State> {
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
    const isCorrect = state.gameState.question.correct === message.answer;
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

    if (
      state.type !== StateType.GamePlaying ||
      typeof state.gameState.question === "undefined"
    ) {
      console.warn("Not playing in answerQuestion");
      return state;
    }

    // Notify the player of the correct answer
    const answerResult: AnswerResult = {
      type: ToClientMessageType.AnswerResult,
      answered: message.answer,
      correctAnswer: state.gameState.question.correct,
      scoreIncrement
    };
    connection.send(answerResult);

    if (this.allPlayersAnswered(state)) {
      for (const player of state.players) {
        const allPlayersAnswered: AllAnswersGiven = {
          type: ToClientMessageType.AllAnswersGiven
        };
        player.connection.send(allPlayersAnswered);
      }
    }

    return state;
  }

  private static startGame(state: DeepReadonly<State>): DeepReadonly<State> {
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
    playlist: DeepReadonly<Playlist>
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
    props: DeepReadonly<Props>,
    state: DeepReadonly<GameStartedState>
  ): Promise<DeepReadonly<State>> {
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

  private static nextQuestion(state: DeepReadonly<State>): DeepReadonly<State> {
    if (
      state.type !== StateType.GamePlaying ||
      typeof state.gameState === "undefined"
    ) {
      console.warn("Cannot go to next question");
      return state;
    }

    const currentTrackNumber = state.gameState.currentTrackNumber + 1;
    if (currentTrackNumber >= state.gameState.trackList.length) {
      return {
        type: StateType.GameOver,
        players: state.players
      };
    } else {
      return {
        ...state,
        gameState: {
          currentTrackNumber,
          trackList: state.gameState.trackList
        }
      };
    }
  }

  private static updatePlayer(
    state: DeepReadonly<State>,
    key: number,
    playerUpdate: (player: DeepReadonly<Player>) => DeepReadonly<Player>
  ): DeepReadonly<State> {
    if (
      state.type !== StateType.PlayerJoin &&
      state.type !== StateType.GamePlaying
    ) {
      console.warn("Player cannot be updated in this state.");
      return state;
    }
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
      throw new Error("Function should only be called while playing");
    return state.players.every(
      player => typeof player.lastAnswer !== "undefined"
    );
  }
}
