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
    case 'opQueue/dropItemsAfter':
        return state.slice(0, state.findIndex(({opName}) => opName === action.afterOpName) + (action.includeOpItself ? 0 : 1));
    default:
        return state;
    }
};

const setOpQueue = opQueue => ({type: 'opQueue/set', opQueue});
const pushItemToOpQueue = (opName, handler) => ({type: 'opQueue/pushItem', item: {opName, handler}});
const deleteItemFromOpQueue = opName => ({type: 'opQueue/dropItem', opName});
const deleteItemsFromOpQueueAfter = (afterOpName, includeOpItself = true) => ({type: 'opQueue/dropItemsAfter', afterOpName, includeOpItself});
const selectOpQueue = state => state.opQueue;


/**
 * @param {{[key: String]: {isSubmitting?: Boolean; isValidating?: Boolean; isValid?: Boolean;};}} state
 * @param {Object} action
 */
const formStatesReducer = (state = {}, action) => {
    switch (action.type) {
    case 'formStates/push':
        return Object.assign({}, state, {[action.id]: action.state || {isSubmitting: false, isValidating: false, isValid: true}});
    case 'formStates/remove':
        const clone = Object.assign({}, state);
        delete clone[action.id];
        return clone;
    case 'formStates/setById':
        if (action.state.isSubmitting)
            action.state.isValidating = true;
        else if (action.state.isSubmitting === false)
            action.state.isValidating = false;
        return Object.assign({}, state, {[action.id]: Object.assign({}, state[action.id], action.state)});
    default:
        return state;
    }
};

const pushFormState = id => ({type: 'formStates/push', id});
const removeFormState = id => ({type: 'formStates/remove', id});
const setFormStateById = (state, id) => ({type: 'formStates/setById', state, id});
const selectFormStates = state => state.formStates;
const selectFormState = (state, id) => state.formStates[id];


////////////////////////////////////////////////////////////////////////////////


const mainStore = createManageableStore(undefined, {
    currentPage: currentPageReducer,
    opQueue: opQueueReducer,
    formStates: formStatesReducer,
});

const observeMainStore = (select, onChange, triggerImmediately = false) =>
    observeStore(mainStore, select, onChange, triggerImmediately)
;


////////////////////////////////////////////////////////////////////////////////


let counter = 0;
class FormStateStoreWrapper {
    // id;
    /**
     * @returns {String}
     * @access public
     */
    pushState() {
        this.id = `formState${++counter}`;
        mainStore.dispatch(pushFormState(this.id));
        return this.id;
    }
    /**
     * @access public
     */
    removeState() {
        mainStore.dispatch(removeFormState(this.id));
    }
    /**
     * @returns {{isSubmitting?: Boolean; isValidating?: Boolean; isValid?: Boolean;}}
     * @access public
     */
    getState() {
        return selectFormState(mainStore.getState(), this.id);
    }
    /**
     * @param {{isSubmitting?: Boolean; isValidating?: Boolean; isValid?: Boolean;}} newState
     * @access public
     */
    setState(newState) {
        mainStore.dispatch(setFormStateById(newState, this.id));
    }
}


////////////////////////////////////////////////////////////////////////////////


export {// Current page
        setCurrentPage, selectCurrentPage,
        // OpQueue
        setOpQueue, pushItemToOpQueue, deleteItemFromOpQueue, deleteItemsFromOpQueueAfter,
        selectOpQueue,
        // Form state
        FormStateStoreWrapper, selectFormStates,
        //
        observeMainStore as observeStore};
export default mainStore;
