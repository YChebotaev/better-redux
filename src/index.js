import React from "react";
import { render } from "react-dom";
import { createStore } from "./createStore";
import { Provider } from "./Provider";
import { connect, selector, mutation } from "./connect";

const store = createStore({
  counter: {
    value: 1
  }
});

const mixProps = {
  count: selector("counter.value"),
  incrCount: mutation("counter.value", (value, { payload }) => {
    return value + payload;
  }),
  decrCount: mutation("counter.value", (value, { payload }) => {
    return value - payload;
  })
};

const ExampleMarkup = ({ count, incrCount, decrCount }) => {
  return (
    <div>
      <button onClick={incrCount}>+</button>
      <span>{count}</span>
      <button onClick={decrCount}>-</button>
    </div>
  );
};

const Example = connect(mixProps)(ExampleMarkup);

const App = () => (
  <Provider store={store}>
    <Example />
  </Provider>
);

render(<App />, document.getElementById("root"));
