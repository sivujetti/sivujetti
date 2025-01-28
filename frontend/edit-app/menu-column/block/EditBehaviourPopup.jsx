/** @extends {preact.Component<{behaviour: BlockBehaviour; behaviourDef: BlockBehaviourDefinition; onDataPropChanged(val: boolean, prop: string): void;}, any>} */
class EditBehaviourPopup extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({behaviourData: {...this.props.behaviour.data}});
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (JSON.stringify(props.behaviour.data) !== JSON.stringify(this.props.behaviour.data))
            this.setState({behaviourData: props.behaviour.data});
    }
    /**
     * @access protected
     */
    render({behaviourDef, behaviour}, {behaviourData}) {
        const EditFormCls = behaviourDef.editForm;
        return <EditFormCls
            behaviour={ {name: behaviour.name, data: {...behaviourData}} }
            emitDataPropChanged={ (val, prop) => { this.props.onDataPropChanged(val, prop); } }
            { ...(behaviourDef.createEditFormProps ? behaviourDef.createEditFormProps(behaviour) : {}) }/>;
    }
}

export default EditBehaviourPopup;