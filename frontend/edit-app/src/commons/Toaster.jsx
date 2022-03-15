import {Icon} from '@sivujetti-commons-for-edit-app';

const toasters = {
    unnamed: null,
};

class Toaster extends preact.Component {
    /**
     * @param {{id?: string; autoCloseTimeoutMillis?: number; className?: string;}} props
     */
    constructor(props) {
        super(props);
        this.id = props.id || 'unnamed';
        if (this.id === '__proto__' || this.id === 'constructor')
            throw new Error(`Invalid toasterId ${this.id}`);
        toasters[this.id] = this.addMessage.bind(this);
        this.autoCloseTimeoutMillis = props.autoCloseTimeoutMillis || 12000;
        this.state = {messages: []};
    }
    /**
     * @param {string|function} message
     * @param {string} level
     */
    addMessage(message, level) {
        this.state.messages.unshift({message, level,
            timeoutId: setTimeout(this.removeMessage.bind(this),
                                  this.autoCloseTimeoutMillis)});
        this.setState({messages: this.state.messages});
    }
    /**
     * @param {{message: string|function; level: string; timeoutId: number;}?} message
     */
    removeMessage(message) {
        const messages = this.state.messages;
        if (!message) { // from timeout
            messages.pop();
        } else { // from onClick
            clearTimeout(message.timeoutId);
            messages.splice(messages.indexOf(message), 1);
        }
        this.setState({messages});
    }
    /**
     * @access protected
     */
    render() {
        if (!this.state.messages.length) return;
        return <div
            id={ `toaster-${this.id}` }
            class={ 'toaster' + (!this.props.className ? '' : ` ${this.props.className}`) }>{
            this.state.messages.map(message => {
                let iconId = 'check';
                if (message.level === 'error') iconId = 'alert-triangle';
                else if (message.level === 'info') iconId = 'info';
                return <div class="box p-0 mb-10">
                    <div class={ `toaster-message ${message.level}` }
                         onClick={ () => this.removeMessage(message) }>
                        <Icon iconId={ iconId } className="mr-10"/>
                        { typeof message.message !== 'function'
                            ? preact.createElement('span', null, message.message)
                            : preact.createElement(message.message) }
                    </div>
                </div>;
            })
        }</div>;
    }
}

export default toasters;
export {Toaster};
