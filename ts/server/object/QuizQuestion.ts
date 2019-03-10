import "babel-polyfill";
import { Track } from "./Track";
import { LoginSuccess } from "../../App";
import * as iots from "io-ts";
import { artist, Artist } from "./Artist";

const QUESTION_OPTIONS = 5;

const relatedArtistsResponse = iots.type({
  artists: iots.array(artist)
});

export interface QuizQuestion {
  options: string[];
  correct: number;
}

function shuffle<T>(array: T[]): T[] {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export async function getArtistQuizQuestion(
  loginSuccess: LoginSuccess,
  track: Track
): Promise<QuizQuestion | undefined> {
  const correctArtists = track.artists;
  const otherOptions: Artist[] = [];

  /** Add related artists */
  const responses = await Promise.all(
    correctArtists.map(artist =>
      fetch(`https://api.spotify.com/v1/artists/${artist.id}/related-artists`, {
        headers: {
          Authorization: `Bearer ${loginSuccess.access_token}`
        }
      })
    )
  );
  for (const response of responses) {
    const decoded = relatedArtistsResponse.decode(response);
    if (decoded.isLeft()) return undefined;
    otherOptions.push(...decoded.value.artists);
  }

  const options = [correctArtists[0]];
  for (let i = 0; i < QUESTION_OPTIONS - 1; i++) {
    const chosen = otherOptions.splice(
      Math.floor(Math.random() * otherOptions.length),
      1
    )[0];
    options.push(chosen);
  }

  const shuffled = shuffle(options);
  const correct = shuffled.indexOf(correctArtists[0]);
  return {
    correct,
    options: shuffled.map(artist => artist.name)
  };
}
