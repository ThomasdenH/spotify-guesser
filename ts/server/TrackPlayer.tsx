import React from "react";
import { Track } from "./object/Track";
import SpotifyPlayer from "./player/SpotifyPlayer";
import { Typography } from "@material-ui/core";

export interface Props {
  track: Track;
  spotifyPlayer: SpotifyPlayer;
}

export default class TrackPlayer extends React.Component<Props, {}> {
  public render(): JSX.Element {
    const { track, spotifyPlayer } = this.props;
    spotifyPlayer.play(track);
    return (
      <React.Fragment>
        <Typography variant="body1">{this.props.track.name}</Typography>
        <Typography variant="body1">{this.props.track.artists.join(', ')}</Typography>
      </React.Fragment>
    );
  }
}
