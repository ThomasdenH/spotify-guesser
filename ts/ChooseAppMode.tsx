import React from "react";
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import Typography from "@material-ui/core/Typography";
import CardActionArea from "@material-ui/core/CardActionArea";
import Smartphone from "@material-ui/icons/Smartphone";
import Computer from "@material-ui/icons/Computer";

export interface Props {
  appModeChosen(appMode: "client" | "server"): void;
}

export default class ChooseAppMode extends React.Component<Props, {}> {
  public render(): JSX.Element {
    return (
      <Grid container spacing={8} direction={"row"}>
        <Grid item xs={12} md={6}>
          <Card
            raised={true}
            onClick={() => this.props.appModeChosen("client")}
          >
            <CardActionArea style={{ padding: 16 }}>
              <Smartphone />
              <Typography variant="h2">Player</Typography>
              <Typography variant="body1">
                Choose this option when you're a player and you want to
                participate to an existing game.
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            raised={true}
            onClick={() => this.props.appModeChosen("server")}
          >
            <CardActionArea style={{ padding: 16 }}>
              <Computer />
              <Typography variant="h2">Host</Typography>
              <Typography variant="body1">
                Choose this option to host a new game that others can join.
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    );
  }
}
