import { Playlist } from "./object/Playlist";
import React from "React";
import Card from "@material-ui/core/Card";
import { CardMedia, Typography, CardActionArea } from "@material-ui/core";

export interface Props {
  onClick(): void;
  playlist: Playlist;
}

export default class PlaylistDisplay extends React.Component<Props> {
  public render(): JSX.Element {
    return (
      <Card
        style={{
          display: "flex",
          flexDirection: "column"
        }}
      >
        <CardActionArea onClick={this.props.onClick}>
          <CardMedia
            style={{
              height: 0,
              paddingTop: "100%"
            }}
            image={this.props.playlist.images[0].url}
            title={this.props.playlist.name}
          />
          <Typography variant="h5">{this.props.playlist.name}</Typography>
        </CardActionArea>
      </Card>
    );
  }
}
