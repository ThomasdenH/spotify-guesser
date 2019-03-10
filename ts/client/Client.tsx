import React from "react";
import Peer from "peerjs";
import ConnectToServer from "./ConnectToServer";
import { Typography, TextField, Button } from "@material-ui/core";
import {
  ToClientMessage,
  ToClientMessageType,
  ToServerMessageType,
  SetName
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
}

export default class Client extends React.Component<Props, State> {
  public state: State = {
    playerName: "",
    playerNameSubmitted: false,
    gameStarted: false
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
      if (typeof this.state.currentQuestion !== "undefined") {
        return (
          <QuestionPanel
            question={this.state.currentQuestion}
            onOptionChosen={() => {}}
          />
        );
      } else {
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
      }
    } else {
      return <React.Fragment />;
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
        case ToClientMessageType.NotifyGameStarted: {
          this.setState({
            gameStarted: true
          });
          break;
        }
        case ToClientMessageType.SendQuestion: {
          this.setState({
            currentQuestion: data.question
          });
        }
      }
    });
    this.setState({ connection });
  }

  private onClickRequestStart(connection: Peer.DataConnection): () => void {
    return () => {
      const message = {
        type: ToServerMessageType.StartGame
      };
      connection.send(message);
    };
  }
}
