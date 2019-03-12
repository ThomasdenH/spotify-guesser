import React from "react";
import Player from "./object/Player";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import { red, green } from "@material-ui/core/colors";

export interface Props {
  player: Player;
}

export default class PlayerInfo extends React.Component<Props, {}> {
  public render(): JSX.Element {
    let backgroundColor = undefined;
    if (typeof this.props.player.lastAnswer !== "undefined") {
      if (this.props.player.lastAnswer.isCorrect) {
        backgroundColor = green[900];
      } else {
        backgroundColor = red[900];
      }
    }
    return (
      <Card style={{ padding: 16, backgroundColor }}>
        <Typography variant="h4">{this.props.player.name}</Typography>
        <Typography variant="body1">
          Score: {this.props.player.score}
        </Typography>
        {typeof this.props.player.lastAnswer !== "undefined" && (
          <Typography variant="body1">
            {this.props.player.lastAnswer.isCorrect ? "Correct!" : "Wrong..."}
          </Typography>
        )}
      </Card>
    );
  }
}
