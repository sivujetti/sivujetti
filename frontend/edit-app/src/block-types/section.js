// ## import {__, http, FormGroupInline, env} from '@sivujetti-commons-for-edit-app';
// ## import ImagePicker from '../block-widget/ImagePicker.jsx';
// ## import setFocusTo from './auto-focusers.js';
// ## import {completeSrc} from './image.js';
// ## 
// ## class SectionBlockEditForm extends preact.Component {
// ##     // imagePicker;
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillMount() {
// ##         const {getBlockCopy, grabChanges} = this.props;
// ##         this.imagePicker = preact.createRef();
// ##         this.setState({bgImageSrc: getBlockCopy().bgImage});
// ##         grabChanges((block, _origin, _isUndo) => {
// ##             if (this.state.bgImageSrc !== block.bgImage)
// ##                 this.setState({bgImageSrc: block.bgImage});
// ##         });
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentDidMount() {
// ##         if (this.props.isVisible)
// ##             setFocusTo(this.imagePicker);
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillReceiveProps(props) {
// ##         if (props.isVisible && !this.props.isVisible)
// ##             setFocusTo(this.imagePicker);
// ##     }
// ##     /**
// ##      * @param {BlockEditFormProps} props
// ##      * @access protected
// ##      */
// ##     render(_, {bgImageSrc}) {
// ##         return <div class="form-horizontal pt-0">
// ##             <FormGroupInline>
// ##                 <label htmlFor="bgImageSrc" class="form-label">{ __('Background#image') }</label>
// ##                 <ImagePicker
// ##                     src={ bgImageSrc }
// ##                     onSrcCommitted={ this.emitNewBgImageSrc.bind(this) }
// ##                     inputId="bgImageSrc"
// ##                     ref={ this.imagePicker }/>
// ##             </FormGroupInline>
// ##         </div>;
// ##     }
// ##     /**
// ##      * @param {String|null} src
// ##      * @param {String|null} mime
// ##      */
// ##     emitNewBgImageSrc(src, mime) {
// ##         const bgImageSrc = src ? completeSrc(src) : '';
// ##         const wasTyped = !mime;
// ##         this.props.emitValueChanged(bgImageSrc, 'bgImage', false, ...(!wasTyped ? [0, 'debounce-none'] : [env.// ## normalTypingDebounceMillis]));
// ##     }
// ## }
// ## 
// ## export default () => {
// ##     const initialData = {bgImage: ''};
// ##     const name = 'Section';
// ##     return {
// ##         name,
// ##         friendlyName: 'Section',
// ##         ownPropNames: Object.keys(initialData),
// ##         initialData,
// ##         defaultRenderer: 'sivujetti:block-generic-wrapper',
// ##         icon: 'layout-rows',
// ##         reRender(block, renderChildren, shouldBackendRender) {
// ##             if (shouldBackendRender)
// ##                 return http.post('/api/blocks/render', {block}).then(resp => resp.result);
// ##             const {bgImage, styleClasses, id} = block;
// ##             return ['<section class="j-', name, styleClasses ? ` ${styleClasses}` : '', '"',
// ##                 bgImage ? ` style="background-image:url('${completeSrc(bgImage)}')"` : '',
// ##                 ' data-block-type="', name, '" data-block="', id, '"><div data-block-root>',
// ##                 renderChildren() +
// ##             '</div></section>'].join('');
// ##         },
// ##         createSnapshot: from => ({
// ##             bgImage: from.bgImage,
// ##         }),
// ##         editForm: SectionBlockEditForm,
// ##     };
// ## };
