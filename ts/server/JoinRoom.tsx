import React from "react";
import Peer from "peerjs";
import { Typography, List, ListItem } from "@material-ui/core";
import Player from "./object/Player";

interface Props {
  players: ReadonlyArray<Readonly<Player>>;
  addPlayer(connection: Peer.DataConnection): void;
}

interface State {
  peer: Peer;
  peerId?: string;
}

export default class JoinRoom extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = {
      peer: new Peer((undefined as unknown) as string)
    };
    this.state.peer.on("open", peerId => this.setState({ peerId }));
    this.state.peer.on("connection", conn => this.onConnection(conn));
  }

  public render(): JSX.Element {
    if (typeof this.state.peerId === "undefined") {
      return <p>Loading...</p>;
    } else {
      return (
        <React.Fragment>
          <Typography variant="h1">{"Waiting for players..."}</Typography>
          <Typography variant="body1">{`You can now join; use the following code:`}</Typography>
          <Typography variant="body1" color="secondary">
            {this.state.peerId}
          </Typography>
          <Typography variant="h2">{"Current players"}</Typography>
          <List>
            {this.props.players.map(player => <ListItem key={player.key}>{player.name}</ListItem>)}
          </List>
        </React.Fragment>
      );
    }
  }

  private onConnection(connection: Peer.DataConnection) {
    this.props.addPlayer(connection);
  }
}
