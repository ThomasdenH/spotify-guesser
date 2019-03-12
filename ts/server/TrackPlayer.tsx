import React from "react";
import { Track } from "./object/Track";
import SpotifyPlayer from "./player/SpotifyPlayer";
import { DeepReadonly } from "ts/util";
import Typography from "@material-ui/core/Typography";

export interface Props {
  track: Track;
  spotifyPlayer: SpotifyPlayer;
  showInfo: boolean;
}

export default class TrackPlayer extends React.Component<
  DeepReadonly<Props>,
  {}
> {
  public render(): JSX.Element {
    const { track, spotifyPlayer } = this.props;
    spotifyPlayer.play(track);
    if (this.props.showInfo) {
      return (
        <React.Fragment>
          <Typography variant="h3">{this.props.track.name}</Typography>
          <Typography variant="h4">
            {this.props.track.artists.map(artist => artist.name).join(", ")}
          </Typography>
        </React.Fragment>
      );
    } else {
      return <React.Fragment />;
    }
  }
}
