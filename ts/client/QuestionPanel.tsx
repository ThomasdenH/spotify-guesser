import React from "react";
import { QuizQuestion } from "../server/object/QuizQuestion";
import {
  Typography,
  Button,
  createMuiTheme,
  MuiThemeProvider
} from "@material-ui/core";
import { DeepReadonly } from "../util";
import { AnswerResult } from "../communication/communication";
import { green, blue, red } from "@material-ui/core/colors";

export interface Props {
  answerResult: DeepReadonly<AnswerResult | undefined>;
  question: DeepReadonly<QuizQuestion>;
  onOptionChosen(option: number): void;
}

export interface State {
  answered?: number;
}

const correctChosenAnswer = createMuiTheme({
  palette: {
    primary: green
  }
});

const incorrectAnswer = createMuiTheme({
  palette: {
    primary: red
  }
});

const correctAnswer = createMuiTheme({
  palette: {
    primary: blue
  }
});

export default class QuestionPanel extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
  }

  public render(): JSX.Element {
    const { answerResult } = this.props;
    return (
      <React.Fragment>
        <Typography variant="h1">Who is an artist of this number?</Typography>
        {this.props.question.options.map((option, index) => {
          const button = (
            <Button
              variant="contained"
              color="primary"
              fullWidth={true}
              disabled={typeof answerResult !== "undefined"}
              key={option}
              onClick={() => this.onOptionClicked(index)}
            >
              {option}
            </Button>
          );

          // Change the theme depending on the result
          if (typeof answerResult !== "undefined") {
            if (
              answerResult.answered == answerResult.correctAnswer &&
              answerResult.answered === index
            ) {
              // Correct & chosen answer
              return (
                <MuiThemeProvider theme={correctChosenAnswer}>
                  {button}
                </MuiThemeProvider>
              );
            } else if (answerResult.answered === index) {
              // Incorrect & chosen answer
              return (
                <MuiThemeProvider theme={incorrectAnswer}>
                  {button}
                </MuiThemeProvider>
              );
            } else if (answerResult.correctAnswer === index) {
              // Incorrect & chosen answer
              return (
                <MuiThemeProvider theme={correctAnswer}>
                  {button}
                </MuiThemeProvider>
              );
            } else {
              // Neither chosen nor correct
              return button;
            }
          } else {
            // Not yet answered
            return button;
          }
        })}
      </React.Fragment>
    );
  }

  private onOptionClicked(answered: number): void {
    this.props.onOptionChosen(answered);
    this.setState({ answered });
  }
}
