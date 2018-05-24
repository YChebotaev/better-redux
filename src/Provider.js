import React from "react";

const { Provider: BaseProvider, Consumer } = React.createContext({
  store: {}
});

export const Provider = ({ store, children }) => {
  return <BaseProvider value={store}>{children}</BaseProvider>;
};

export { Consumer };
