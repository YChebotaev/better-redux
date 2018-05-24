import React from "react";
import { Consumer } from "./Provider";
import { VOLATILE_SET } from "./createStore";
import { get, mapValues } from "lodash";

export const selector = path => {
  return (_, getState) => {
    return get(getState(), path);
  };
};

export const mutation = (path, updater) => {
  return (_, getState) => {
    const oldValue = get(getState(), path);
    const newValue = updater(oldValue);
    return {
      type: VOLATILE_SET,
      payload: newValue,
      meta: {
        path,
        updater,
        oldValue
      }
    };
  };
};

export const action = (...args) => {
  return async dispatch => dispatch(await action(...args));
};

export const resolveProps = (store, config, ownProps) =>
  Object.assign(
    {},
    ownProps,
    mapValues(config, value => (...args) => {
      value = store.dispatch(value(...args), { forceSync: true });
      console.info(38, "value", value);
      return value;
    })
  );

export const connect = config => WrappedComponent => ownProps => (
  <Consumer>
    {({ store }) => (
      <WrappedComponent
        store={store}
        {...resolveProps(store, config, ownProps)}
      />
    )}
  </Consumer>
);
