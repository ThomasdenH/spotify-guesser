import * as iots from "io-ts";
import { image } from "./Image";
import { pagingObject } from "./PagingObject";
import "babel-polyfill";
import { LoginSuccess } from "../../App";
import { Track, track } from "./Track";

export const playlist = iots.type({
  images: iots.array(image),
  name: iots.string,
  id: iots.string,
  tracks: iots.type({
    href: iots.string,
    total: iots.Integer
  })
});
export interface Playlist extends iots.TypeOf<typeof playlist> {}

const playlistTrack = iots.type({
  track
});

export const playlistsResponse = pagingObject(playlist);

const CURRENT_USER_PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
export async function getPlaylistsOfUser(
  loginSuccess: LoginSuccess
): Promise<iots.Validation<iots.TypeOf<typeof playlistsResponse>>> {
  const response = await fetch(CURRENT_USER_PLAYLISTS, {
    headers: {
      Authorization: `Bearer ${loginSuccess.access_token}`
    }
  });
  return playlistsResponse.decode(await response.json());
}

export async function getTrackFromPlaylist(
  loginSuccess: LoginSuccess,
  playlist: Playlist,
  trackIndex: number
): Promise<iots.Validation<Track>> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlist.id}/tracks\
?limit=1\
&offset=${trackIndex}`,
    {
      headers: {
        Authorization: `Bearer ${loginSuccess.access_token}`
      }
    }
  );
  return pagingObject(playlistTrack)
    .decode(await response.json())
    .map(o => o.items[0].track);
}
