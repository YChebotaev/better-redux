import { isEmpty, isFunction, cloneDeep, has, set } from "lodash";

export const NOOP_REDUCER = (state, { type, meta, payload: value }) => {
  switch (type) {
    case VOLATILE_SET:
      return set(cloneDeep(state), meta.path, value);
    default:
      return state;
  }
};

export const NOOP_MIDDLEWARE = () => {};

export const VOLATILE_SET = "@@STORE//VOLATILE_SET";

export class Store {
  constructor({
    reducer = NOOP_REDUCER,
    initialState = {},
    middleware = NOOP_MIDDLEWARE,
    initialActions = []
  }) {
    let handle,
      state = initialState;

    const actions = [].concat(initialActions);
    const deferredActions = new WeakMap();

    const getDeferredFor = action => {
      let deferred = deferredActions.get(action);
      if (deferred == null) {
        let resolve, reject;
        const promise = new Promise((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        });
        deferred = {
          promise,
          resolve,
          reject
        };
        deferredActions.set(action, deferred);
      }
      return deferred;
    };

    const asyncDispatch = async action => {
      actions.push(await action);
      scheduleApplyActions();
      return getDeferredFor(action).promise;
    };

    const syncDispatch = action => {
      return applyAction(action);
    };

    const dispatch = (action, { forceSync }) => {
      if (forceSync) {
        return syncDispatch(action);
      } else {
        return asyncDispatch(action);
      }
    };

    const isAction = maybeAction => {
      return has(maybeAction, "type");
    };

    const applyAction = action => {
      let result;
      if (isFunction(action)) {
        result = action(dispatch, getState, this);
      }
      if (isAction(result)) {
        state = reducer(state, action);
      }
      return result;
    };

    const applyActions = async () => {
      let action, result;
      try {
        while (!isEmpty(actions)) {
          action = actions.pop();
          result = applyAction(action);
          getDeferredFor(action).resolve(result);
        }
      } catch (error) {
        // Fallback to default error handler
        this._actionErrorHandler(error, action, state);
        getDeferredFor(action).reject(error);
      } finally {
        // Continue processing
        applyActions();
        return state;
      }
    };

    const getState = () => {
      if (!isEmpty(actions)) {
        state = applyActions();
      }
      return state;
    };

    const scheduleApplyActions = () => {
      if (handle) {
        cancelIdleCallback(handle);
      }
      applyActions();
      handle = requestIdleCallback(scheduleApplyActions);
    };

    if (!isEmpty(actions)) {
      scheduleApplyActions();
    }

    Object.assign(this, {
      getState,
      dispatch
    });
  }

  _actionErrorHandler = (error, action, state) => {
    console.error(
      "Error while applying action",
      action,
      " to state ",
      state,
      ": ",
      error
    );
  };
}

export const createStore = (reducer, initialState, middleware) => {
  return new Store({
    reducer,
    initialState,
    middleware
  });
};
