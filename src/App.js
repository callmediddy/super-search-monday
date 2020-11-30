import React from "react";
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import "./App.css";
// import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
import SearchView from './views/SearchView';
import HistoryView from './views/HistoryView'
import OptionSelection from './views/OptionSelection';

class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      name: "",
    };
  }

  componentDidMount() {
    // TODO: set up event listeners
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={OptionSelection} key="1" />
          <Route exact path="/search" component={SearchView} key="2"/>
          <Route exact path="/view/history" component={HistoryView} key="3"/>

        </Switch>
      </Router>
    )
  }
}

export default App;
