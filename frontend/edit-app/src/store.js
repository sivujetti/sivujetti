import {createManageableStore, observeStore} from './redux-utils.js';

/**
 * @param {CurrentPageData} state
 * @param {{type: 'currentPageDataBundle/set';, value: CurrentPageData;}} action
 */
const currentPageDataBundleReducer = (state = {}, action) => {
    switch (action.type) {
    case 'currentPageDataBundle/set':
        return Object.assign({}, state, action.value);
    default:
        return state;
    }
};

const setCurrentPageDataBundle = value => ({type: 'currentPageDataBundle/set', value});
const selectCurrentPageDataBundle = state => state.currentPageDataBundle;

/**
 * @param {Array<{opName: String; command: OpQueueCommand;}>} state
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

/**
 * @param {Array<OpQueueCommand>} opQueue
 */
const setOpQueue = opQueue => ({type: 'opQueue/set', opQueue});
/**
 * @param {String} opName
 * @param {OpQueueCommand} command
 */
const pushItemToOpQueue = (opName, command) => ({type: 'opQueue/pushItem', item: {opName, command}});
/**
 * @param {String} opName
 */
const deleteItemFromOpQueue = opName => ({type: 'opQueue/dropItem', opName});
/**
 * @param {String} afterOpName
 * @param {Boolean} includeOpItself = true
 */
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
    currentPageDataBundle: currentPageDataBundleReducer,
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

/**
 * @typedef OpQueueCommand
 * @prop {Function} doHandle
 * @prop {Array} args
 */

////////////////////////////////////////////////////////////////////////////////


export {setCurrentPageDataBundle, selectCurrentPageDataBundle,
        //
        setOpQueue, pushItemToOpQueue, deleteItemFromOpQueue, deleteItemsFromOpQueueAfter,
        selectOpQueue,
        //
        FormStateStoreWrapper, selectFormStates,
        //
        observeMainStore as observeStore};
export default mainStore;
