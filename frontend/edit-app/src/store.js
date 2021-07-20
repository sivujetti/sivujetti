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

const setCurrentPage = value => ({type: 'currentPage/set', value});
const selectCurrentPage = state => state.currentPage;


/**
 * @param {Array<{opName: String; handler: Function;}>} state
 * @param {Object} action
 */
const opQueueReducer = (state = [], action) => {
    switch (action.type) {
    case 'opQueue/set':
        return action.opQueue;
    case 'opQueue/pushItem':
        return state.concat(action.item);
    case 'opQueue/dropItem':
        return state.filter(({opName}) => opName !== action.opName);
    default:
        return state;
    }
};

const setOpQueue = opQueue => ({type: 'opQueue/set', opQueue});
const pushItemToOpQueue = (opName, handler) => ({type: 'opQueue/pushItem', item: {opName, handler}});
const deleteItemFromOpQueue = opName => ({type: 'opQueue/dropItem', opName});
const selectOpQueue = state => state.opQueue;


////////////////////////////////////////////////////////////////////////////////


const mainStore = createManageableStore(undefined, {
    currentPage: currentPageReducer,
    opQueue: opQueueReducer
});

const observeMainStore = (select, onChange, triggerImmediately = false) =>
    observeStore(mainStore, select, onChange, triggerImmediately)
;

export {setCurrentPage, selectCurrentPage,
        setOpQueue, pushItemToOpQueue, deleteItemFromOpQueue, selectOpQueue,
        observeMainStore as observeStore};
export default mainStore;
