import {Icon} from '@sivujetti-commons-for-edit-app';

const toasters = {
    unnamed: null,
};

class Toaster extends preact.Component {
    /**
     * @param {{id?: String; autoCloseTimeoutMillis?: Number; className?: String;}} props
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
     * @param {preact.ComponentChild} message
     * @param {String} level
     * @param {Number} timeout = this.autoCloseTimeoutMillis
     * @param {() => void} onDismissed = null
     */
    addMessage(message, level, timeout = this.autoCloseTimeoutMillis, onDismissed = null) {
        this.state.messages.unshift({message, level,
            addedAt: Date.now(),
            timeoutId: timeout > 0 ? setTimeout(this.removeMessage.bind(this), this.autoCloseTimeoutMillis) : null,
            onDismissed});
        this.setState({messages: this.state.messages});
    }
    /**
     * @param {{message: preact.ComponentChild; level: String; timeoutId: Number;}?} message
     */
    removeMessage(message) {
        const messages = this.state.messages;
        if (!message) { // from timeout
            const message = messages.pop();
            if (message.onDismissed) message.onDismissed();
        } else { // from onClick
            const hasBeenVisibleMillis = Date.now() - message.addedAt;
            if (hasBeenVisibleMillis < 2000) return;
            if (message.timeoutId) clearTimeout(message.timeoutId);
            if (message.onDismissed) message.onDismissed();
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
                else if (message.level === 'info') iconId = 'info-circle';
                return <div class="box p-0 mb-10">
                    <div class={ `toaster-message ${message.level}` } onClick={ () => this.removeMessage(message) }>
                        <Icon iconId={ iconId } className="mr-10"/>
                        { typeof message.message === 'string' ? <span>{ message.message }</span> : message.message }
                    </div>
                </div>;
            })
        }</div>;
    }
}

export default toasters;
export {Toaster};
