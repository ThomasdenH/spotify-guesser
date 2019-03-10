import React from "react";
import { Grid, Card, Typography, CardActionArea } from "@material-ui/core";

export interface Props {
  appModeChosen(appMode: "client" | "server"): void;
}

export default class ChooseAppMode extends React.Component<Props, {}> {
  public render(): JSX.Element {
    return (
      <Grid xs={12} md={6} spacing={8} direction={"row"}>
        <Card raised={true} onClick={() => this.props.appModeChosen("client")}>
          <CardActionArea>
            <Typography variant="h2">Player</Typography>
            <Typography variant="body1">
              Choose this option when you're a player and you want to
              participate to an existing game.
            </Typography>
          </CardActionArea>
        </Card>
        <Card raised={true} onClick={() => this.props.appModeChosen("server")}>
          <CardActionArea>
            <Typography variant="h2">Host</Typography>
            <Typography variant="body1">
              Choose this option to host a new game that others can join.
            </Typography>
          </CardActionArea>
        </Card>
      </Grid>
    );
  }
}
