import {__, FormGroup} from '@sivujetti-commons-for-edit-app';
import Tagify from './Tagify.jsx';

class StyleClassesPicker extends preact.Component {
    // tagify;
    /**
     * @access protected
     */
    componentWillMount() {
        this.tagify = preact.createRef();
    }
    /**
     * @param {{currentClasses: String; onClassesChanged(classes: String): void;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.currentClasses !== this.props.currentClasses)
            this.tagify.current.exchangeTags(props.currentClasses);
    }
    /**
     * @access protected
     */
    shouldComponentUpdate() {
        return false;
    }
    /**
     * @access protected
     */
    render({currentClasses}) {
        return <FormGroup>
            <label class="form-label mt-1 pb-1 pt-2 color-dimmed2">{ __('Css classes') }</label>
            <Tagify
                tags={ currentClasses }
                createTagsDropdownChoices={ createTagifyChoices }
                onChanged={ this.props.onClassesChanged }
                ref={ this.tagify }/>
        </FormGroup>;
    }
}

const cursors = [
    'c-hand',
    'c-move',
    'c-zoom-in',
    'c-zoom-out',
    'c-not-allowed',
    'c-auto',
];
const colors = [
    // text
    'text-primary',
    'text-secondary',
    'text-dark',
    'text-gray',
    'text-light',
    'text-success',
    'text-warning',
    'text-error',
    // bg
    'bg-primary',
    'bg-secondary',
    'bg-dark',
    'bg-gray',
    'bg-success',
    'bg-warning',
    'bg-error',
];
const display = [
    // flow
    'd-block',
    'd-inline',
    'd-inline-block',
    'd-flex',
    'd-inline-flex',
    'd-none',
    'd-hide',
    // visibility
    'd-visible',
    'd-invisible',
    'text-hide',
];
const position = [
    // margin
    'm-1',
    'm-2',
    'mt-1','mr-1','mb-1','ml-1',
    'mt-2','mr-2','mb-2','ml-2',
    'mx-1','mx-2',
    'my-1','my-2',
    // padding
    'p-1',
    'p-2',
    'pt-1','pr-1','pb-1','pl-1',
    'pt-2','pr-2','pb-2','pl-2',
    'px-1','px-2',
    'py-1','py-2',
    // position
    'p-relative',
    'p-absolute',
    'p-fixed',
    'p-sticky',
    'p-centered',
    // floats
    'float-left',
    'float-right',
    'clearfix',
]
const text = [
    // alignment
    'text-left',
    'text-center',
    'text-right',
    'text-justify',
    // weight
    'text-normal',
    'text-bold',
    'text-italic',
    // emphasis
    'text-muted',
    'text-large',
    'text-small',
    'text-tiny',
    // overflow
    'text-ellipsis',
    'text-clip',
    'text-break',
    // case
    'text-lowercase',
    'text-uppercase',
    'text-capitalize',
];
const spectreCssClasses = [
    ...text,
    ...position,
    ...colors,
    ...display,
    ...cursors,
];

/**
 * @returns {Array<String>}
 */
function createTagifyChoices() {
    const devDefinedCustomClassStyleNames = []; // todo
    return [
        ...devDefinedCustomClassStyleNames,
        ...spectreCssClasses,
    ];
}

export default StyleClassesPicker;
