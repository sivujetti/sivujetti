import {fetchOrGet as fetchOrGetReusableBranches} from '../../includes/reusable-branches/repository.js';
class DnDBlockSpawner extends preact.Component {
    render() {
    /**
     * @access protected
     */
    componentDidMount() {
        this.setState({isMounted: true});
        if (this.props.initiallyIsOpen)
            this.toggleIsOpen();
    }
        return <div id="dnd-block-spawner">
            todo
        </div>;
    }
    /**
     * @access private
     */
    toggleIsOpen() {
        const currentlyIsOpen = this.state.isOpen;
        const newIsOpen = !currentlyIsOpen;
        if (newIsOpen) {
            fetchOrGetReusableBranches()
                .then((reusables) => {
                    this.setState({reusables});
                });
        this.setState({isOpen: newIsOpen});
    }
}

export default DnDBlockSpawner;
