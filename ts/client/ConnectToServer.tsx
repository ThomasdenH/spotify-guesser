import React from "react";
import Peer from "peerjs";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

export interface Props {
  onConnect(p: Peer.DataConnection): void;
  reportError(message: string): void;
}

interface State {
  inputValue: string;
}

export default class ConnectToServer extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = {
      inputValue: ""
    };
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <Typography variant="h3" style={{ marginBottom: 16 }}>
          {"Please enter the room ID you want to connect to:"}
        </Typography>
        <TextField
          autoFocus={true}
          type="text"
          value={this.state.inputValue}
          style={{ marginRight: 16 }}
          onChange={v => this.setState({ inputValue: v.currentTarget.value })}
        />
        <Button variant="contained" onClick={() => this.startConnection()}>
          Start!
        </Button>
      </React.Fragment>
    );
  }

  public startConnection(): void {
    const peer = new Peer({});
    const connection = peer.connect(this.state.inputValue);
    connection.on("open", () => this.props.onConnect(connection));
  }
}
