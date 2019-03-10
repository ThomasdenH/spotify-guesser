import "babel-polyfill";
import { Track, track } from "./Track";
import { LoginSuccess } from "../../App";
import * as iots from "io-ts";
import { artist, Artist } from "./Artist";

const QUESTION_OPTIONS = 5;

const relatedArtistsResponse = iots.type({
  artists: iots.array(artist)
});

const recommendationsResponseObject = iots.type({
  tracks: iots.array(track)
});

export interface QuizQuestion {
  options: string[];
}

export interface QuizQuestionWithAnswer extends QuizQuestion {
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

export async function getSongQuizQuestion(
  loginSuccess: LoginSuccess,
  track: Track
): Promise<QuizQuestionWithAnswer | undefined> {
  const response = await fetch(
    `https://api.spotify.com/v1/recommendations\
?seed_tracks=${encodeURIComponent(track.id)}`,
    {
      headers: {
        Authorization: `Bearer ${loginSuccess.access_token}`
      }
    }
  );
  const decoded = recommendationsResponseObject.decode(await response.json());
  if (decoded.isLeft()) return undefined;
  const otherOptions = decoded.value.tracks;

  const options = [track];
  for (let i = 0; i < QUESTION_OPTIONS - 1; i++) {
    const chosen = otherOptions.splice(
      Math.floor(Math.random() * otherOptions.length),
      1
    )[0];
    options.push(chosen);
  }

  const shuffled = shuffle(options);
  const correct = shuffled.indexOf(track);
  return {
    correct,
    options: shuffled.map(track => track.name)
  };
}

export async function getArtistQuizQuestion(
  loginSuccess: LoginSuccess,
  track: Track
): Promise<QuizQuestionWithAnswer | undefined> {
  const correctArtists = track.artists;
  const chosenCorrectArtist =
    correctArtists[Math.floor(correctArtists.length * Math.random())];
  if (typeof chosenCorrectArtist === "undefined") return undefined;
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
    const decoded = relatedArtistsResponse.decode(await response.json());
    if (decoded.isLeft()) return undefined;
    otherOptions.push(
      ...decoded.value.artists
        // Filter out correct artists
        .filter(
          artist =>
            !correctArtists.some(
              correctArtist => artist.id === correctArtist.id
            )
        )
    );
  }

  if (otherOptions.length < 4) return undefined;

  const options = [chosenCorrectArtist];
  for (let i = 0; i < QUESTION_OPTIONS - 1; i++) {
    const chosen = otherOptions.splice(
      Math.floor(Math.random() * otherOptions.length),
      1
    )[0];
    options.push(chosen);
  }

  const shuffled = shuffle(options);
  const correct = shuffled.indexOf(chosenCorrectArtist);
  return {
    correct,
    options: shuffled.map(artist => artist.name)
  };
}
