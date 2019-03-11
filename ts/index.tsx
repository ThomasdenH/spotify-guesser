import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import CssBaseline from "@material-ui/core/CssBaseline";
import { MuiThemeProvider } from "@material-ui/core";
import { theme } from "./theme";

ReactDOM.render(
  <MuiThemeProvider theme={theme}>
    <CssBaseline>
      <div style={{padding: 16}}>
        <App />
      </div>
    </CssBaseline>
  </MuiThemeProvider>,
  document.getElementById("root")
);
