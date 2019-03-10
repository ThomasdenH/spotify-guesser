import { DeepReadonly } from "../util";
import { QuizQuestion } from "../server/object/QuizQuestion";

export const enum ToServerMessageType {
  SetName,
  StartGame,
  AnswerQuestion
}

export const enum ToClientMessageType {
  NotifyGameStarted,
  SendQuestion,
  AnswerResult
}

interface ToServerBaseMessage<T extends ToServerMessageType> {
  type: T;
}

interface ToClientBaseMessage<T extends ToClientMessageType> {
  type: T;
}

/**
 * Sent by a player they change their name.
 */
export interface SetName
  extends ToServerBaseMessage<ToServerMessageType.SetName> {
  name: string;
}

export interface AnswerQuestion
  extends ToServerBaseMessage<ToServerMessageType.AnswerQuestion> {
  answer: number;
}

/**
 * Sent by a player when they want to start a game.
 */
export interface StartGame
  extends ToServerBaseMessage<ToServerMessageType.StartGame> {}

export type ToServerMessage = SetName | StartGame | AnswerQuestion;

export interface NotifyGameStarted
  extends ToClientBaseMessage<ToClientMessageType.NotifyGameStarted> {}

export interface SendQuestion
  extends ToClientBaseMessage<ToClientMessageType.SendQuestion> {
  question: DeepReadonly<QuizQuestion>;
}

/**
 * Send to the client to notify them of the correct answer.
 */
export interface AnswerResult
  extends ToClientBaseMessage<ToClientMessageType.AnswerResult> {
  answered: number;
  correctAnswer: number;
}

export type ToClientMessage = NotifyGameStarted | SendQuestion | AnswerResult;
