import React from "react";
import { Track } from "./object/Track";
import SpotifyPlayer from "./player/SpotifyPlayer";

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
        <p>{this.props.track.name}</p>
      </React.Fragment>
    );
  }
}
