import React from "react";
import { LoginSuccess } from "../App";
import {
  Playlist,
  getPlaylistsOfUser,
  getAllFeaturedPlaylists
} from "./object/Playlist";
import PlaylistDisplay from "./PlaylistDisplay";
import "babel-polyfill";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";

export interface Props {
  loginState: Readonly<LoginSuccess>;
  reportError(error: string): void;
  onPlaylistChosen(playlist: Playlist): void;
}

export interface State {
  playlists?: ReadonlyArray<Readonly<Playlist>>;
}

export default class ChoosePlaylist extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render(): JSX.Element {
    if (typeof this.state.playlists !== "undefined") {
      return (
        <React.Fragment>
          <Typography variant="h2" style={{ marginBottom: 16 }}>
            {"Choose a playlist"}
          </Typography>
          <Grid container spacing={16} justify="center">
            {this.state.playlists.map(playlist => (
              <Grid item xs={6} sm={3} key={playlist.id}>
                <PlaylistDisplay
                  playlist={playlist}
                  onClick={() => this.props.onPlaylistChosen(playlist)}
                />
              </Grid>
            ))}
          </Grid>
        </React.Fragment>
      );
    } else {
      this.loadPlayLists(this.props.loginState);
      return <h1>Laden...</h1>;
    }
  }

  public async loadPlayLists(loginSuccess: LoginSuccess): Promise<void> {
    const playlistsEither = await getPlaylistsOfUser(loginSuccess);
    const featuredPlaylistsEither = await getAllFeaturedPlaylists(loginSuccess);
    if (playlistsEither.isRight() && featuredPlaylistsEither.isRight()) {
      this.setState({
        playlists: [
          ...playlistsEither.value.items,
          ...featuredPlaylistsEither.value.playlists.items
        ]
      });
    } else {
      this.props.reportError("Could not decode playlists");
    }
  }
}
