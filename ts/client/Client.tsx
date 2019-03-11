import React from "react";
import Peer from "peerjs";
import ConnectToServer from "./ConnectToServer";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import {
  ToClientMessage,
  ToClientMessageType,
  ToServerMessageType,
  SetName,
  AnswerQuestion,
  AnswerResult,
  SendQuestion,
  NextQuestion
} from "../communication/communication";
import { QuizQuestion } from "../server/object/QuizQuestion";
import { DeepReadonly } from "../util";
import QuestionPanel from "./QuestionPanel";

export interface Props {
  reportError(message: string): void;
}

interface State {
  playerNameSubmitted: boolean;
  playerName: string;
  connection?: Peer.DataConnection;
  gameStarted: boolean;
  currentQuestion?: DeepReadonly<QuizQuestion>;
  answerResult?: DeepReadonly<AnswerResult>;
  /** If true, the button to show the next question should be shown. */
  showNextQuestion: boolean;
}

export default class Client extends React.Component<
  Props,
  DeepReadonly<State>
> {
  public state: State = {
    playerName: "",
    playerNameSubmitted: false,
    gameStarted: false,
    showNextQuestion: false
  };

  public render(): JSX.Element {
    if (!this.state.playerNameSubmitted) {
      return (
        <React.Fragment>
          <Typography variant="h1">{"Please enter your name:"}</Typography>
          <TextField
            value={this.state.playerName}
            onChange={ev =>
              this.setState({ playerName: ev.currentTarget.value })
            }
          />
          <Button onClick={() => this.setState({ playerNameSubmitted: true })}>
            {"Done"}
          </Button>
        </React.Fragment>
      );
    } else if (typeof this.state.connection === "undefined") {
      return (
        <ConnectToServer
          reportError={this.props.reportError}
          onConnect={(connection: Peer.DataConnection) =>
            this.onConnect(connection)
          }
        />
      );
    } else if (!this.state.gameStarted) {
      return (
        <React.Fragment>
          <Typography variant="h1">{`Welcome, ${
            this.state.playerName
          }!`}</Typography>
          <Button onClick={this.onClickRequestStart(this.state.connection)}>
            Start game
          </Button>
        </React.Fragment>
      );
    } else if (typeof this.state.currentQuestion !== "undefined") {
      const { connection } = this.state;
      return (
        <React.Fragment>
          <QuestionPanel
            answerResult={this.state.answerResult}
            question={this.state.currentQuestion}
            onOptionChosen={answer => this.onAnswerQuestion(answer)}
          />
          {this.state.showNextQuestion && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => this.onClickNextQuestion(connection)}
            >
              Next question
            </Button>
          )}
        </React.Fragment>
      );
    } else {
      return <React.Fragment>Waiting for next question</React.Fragment>;
    }
  }

  private onConnect(connection: Peer.DataConnection): void {
    const setPlayerName: SetName = {
      type: ToServerMessageType.SetName,
      name: this.state.playerName
    };
    connection.send(setPlayerName);
    connection.on("data", (data: ToClientMessage) => {
      switch (data.type) {
        case ToClientMessageType.NotifyGameStarted:
          return this.setState(state => Client.onGameStarted(state));
        case ToClientMessageType.SendQuestion:
          return this.setState(state => Client.onSendQuestion(state, data));
        case ToClientMessageType.AnswerResult:
          return this.setState({ answerResult: data });
        case ToClientMessageType.AllAnswersGiven:
          return this.setState({ showNextQuestion: true });
        case ToClientMessageType.GameEnded:
          return this.setState({ gameStarted: false });
      }
    });
    this.setState({ connection });
  }

  private static onGameStarted(
    state: DeepReadonly<State>
  ): DeepReadonly<State> {
    return {
      ...state,
      currentQuestion: undefined,
      answerResult: undefined,
      showNextQuestion: false,
      gameStarted: true
    };
  }

  private static onSendQuestion(
    state: DeepReadonly<State>,
    message: DeepReadonly<SendQuestion>
  ): DeepReadonly<State> {
    return {
      ...state,
      currentQuestion: message.question,
      answerResult: undefined,
      showNextQuestion: false
    };
  }

  private onAnswerQuestion(answer: number): void {
    if (typeof this.state.connection === "undefined")
      throw new Error("The connection is undefined");
    const answerQuestion: AnswerQuestion = {
      type: ToServerMessageType.AnswerQuestion,
      answer
    };
    this.state.connection.send(answerQuestion);
  }

  private onClickRequestStart(connection: Peer.DataConnection): () => void {
    return () => {
      const message = {
        type: ToServerMessageType.StartGame
      };
      connection.send(message);
    };
  }

  private onClickNextQuestion(connection: Peer.DataConnection): void {
    const showNextQuestion: NextQuestion = {
      type: ToServerMessageType.NextQuestion
    };
    connection.send(showNextQuestion);
  }
}
