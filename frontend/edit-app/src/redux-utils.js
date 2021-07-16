const {createStore, combineReducers} = window.Redux;

// https://github.com/reduxjs/redux/issues/303#issuecomment-125184409
function observeStore(store, select, onChange, triggerImmediately = false) {
  let currentState;

  function handleChange() {
    let nextState = select(store.getState());
    if (nextState !== currentState) {
      currentState = nextState;
      onChange(currentState);
    }
  }

  let unsubscribe = store.subscribe(handleChange);
  if (triggerImmediately) handleChange();
  return unsubscribe;
}

function createReducerManager(initialReducers) {
  // Create an object which maps keys to reducers
  const reducers = initialReducers;

  // Create the initial combinedReducer
  let combinedReducer = combineReducers(reducers);

  // An array which is used to delete state keys when reducers are removed
  let keysToRemove = [];

  return {
    getReducerMap: () => reducers,

    // The root reducer function exposed by this object
    // This will be passed to the store
    reduce: (state, action) => {
      // If any reducers have been removed, clean up their state first
      if (keysToRemove.length > 0) {
        state = Object.assign({},state);
        for (let key of keysToRemove) {
          delete state[key];
        }
        keysToRemove = [];
      }

      // Delegate to the combined reducer
      return combinedReducer(state, action);
    },

    // Adds a new reducer with the specified key
    add: (key, reducer) => {
      if (key === '__proto__');// @todo
      if (!key || reducers[key]) {
        return;
      }

      // Add the reducer to the reducer mapping
      reducers[key] = reducer;

      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers);
    },

    // Removes a reducer with the specified key
    remove: key => {
      if (key === '__proto__');// @todo
      if (!key || !reducers[key]) {
        return;
      }

      // Remove it from the reducer mapping
      delete reducers[key];

      // Add the key to the list of keys to clean up
      keysToRemove.push(key);

      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers);
    }
  };
}

const createManageableStore = (initialState, staticReducers) => {
  const reducerManager = createReducerManager(staticReducers);

  // Create a store with the root reducer function being the one exposed by the manager.
  const store = createStore(reducerManager.reduce, initialState);

  // Optional: Put the reducer manager on the store so it is easily accessible
  store.reducerManager = reducerManager;

  return store;
};

export {createManageableStore, observeStore};
