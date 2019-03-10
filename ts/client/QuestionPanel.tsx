import React from "react";
import { QuizQuestion } from "ts/server/object/QuizQuestion";
import { Typography, Button } from "@material-ui/core";
import { DeepReadonly } from "ts/util";

export interface Props {
  question: DeepReadonly<QuizQuestion>;
  onOptionChosen(option: number): void;
}

export interface State {
  answered?: number;
}

export default class QuestionPanel extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <Typography variant="h1">What is the primary artist?</Typography>
        {this.props.question.options.map((option, index) => {
          <Button key={option} onClick={() => this.onOptionClicked(index)}>
            {option}
          </Button>;
        })}
      </React.Fragment>
    );
  }

  private onOptionClicked(answered: number): void {
    this.props.onOptionChosen(answered);
    this.setState({ answered });
  }
}
