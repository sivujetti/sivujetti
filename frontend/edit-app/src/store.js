import {createManageableStore, observeStore} from './redux-utils.js';

/**
 * @param {Object} state
 * @param {Object} action
 */
const currentPageReducer = (state = {}, action) => {
    switch (action.type) {
    case 'currentPage/set':
        return Object.assign({}, state, action.value);
    default:
        return state;
    }
};

const setCurrentPage = (value) => ({type: 'currentPage/set', value});
const selectCurrentPage = (state) => state.currentPage;


/**
 * @param {String} state
 * @param {Object} action
 */
const loadStateReducer = (state = 'none', action) => {
    switch (action.type) {
    case 'loadState/set':
        return action.value;
    default:
        return state;
    }
};

const setLoadState = (stateName) => ({type: 'loadState/set', value: stateName});
const selectLoadState = (state) => state.loadState;


////////////////////////////////////////////////////////////////////////////////


const mainStore = createManageableStore(undefined, {
    'currentPage': currentPageReducer,
    'loadState': loadStateReducer,
});

const observeMainStore = (select, onChange, triggerImmediately = false) =>
    observeStore(mainStore, select, onChange, triggerImmediately)
;

export {setCurrentPage, selectCurrentPage,
        setLoadState, selectLoadState,
        observeMainStore as observeStore};
export default mainStore;
