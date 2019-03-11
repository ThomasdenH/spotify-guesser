import React from "react";
import Player from "./object/Player";
import Typography from '@material-ui/core/Typography';

export interface Props {
  player: Player;
}

export default class PlayerInfo extends React.Component<Props, {}> {
  public render(): JSX.Element {
    return (
      <React.Fragment>
        <Typography variant="h4">{this.props.player.name}</Typography>
        <Typography variant="body1">
          Score: {this.props.player.score}
        </Typography>
        {typeof this.props.player.lastAnswer !== "undefined" &&
          (this.props.player.lastAnswer.isCorrect && (
            <Typography variant="body1">
              {this.props.player.lastAnswer.isCorrect ? "Correct!" : "Wrong..."}
            </Typography>
          ))}
      </React.Fragment>
    );
  }
}
