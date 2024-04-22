// ## import {__, env, urlUtils, hookForm, unhookForm, reHookValues, FormGroup,
// ##         Textarea, InputErrors, Icon, validationConstraints} from '@sivujetti-commons-for-edit-app';
// ## import ImagePicker from '../block-widget/ImagePicker.jsx';
// ## import {placeholderImageSrc} from '../commons/FileUploader.jsx';
// ## import setFocusTo from './auto-focusers.js';
// ## 
// ## class ImageBlockEditForm extends preact.Component {
// ##     // imagePicker;
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillMount() {
// ##         this.imagePicker = preact.createRef();
// ##         const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
// ##         const {src, altText, caption} = getBlockCopy();
// ##         this.setState(hookForm(this, [
// ##             {name: 'altText', value: altText, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
// ##              label: __('Alt text'), onAfterValueChanged: (value, hasErrors, source) => {
// ##                 if (source !== 'undo') emitValueChanged(value, 'altText', hasErrors, env.normalTypingDebounceMillis);
// ##             }},
// ##             {name: 'caption', value: caption, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
// ##              label: __('Caption'), onAfterValueChanged: (value, hasErrors, source) => {
// ##                 if (source !== 'undo') emitValueChanged(value, 'caption', hasErrors, env.normalTypingDebounceMillis);
// ##             }},
// ##         ], {
// ##             src,
// ##         }));
// ##         grabChanges((block, _origin, isUndo) => {
// ##             if (this.state.src !== block.src)
// ##                 this.setState({src: block.src});
// ##             if (isUndo && (this.state.values.altText !== block.altText ||
// ##                            this.state.values.caption !== block.caption))
// ##                 reHookValues(this, [{name: 'altText', value: block.altText},
// ##                                     {name: 'caption', value: block.caption}]);
// ##         });
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentDidMount() {
// ##         setFocusTo(this.imagePicker);
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillUnmount() {
// ##         unhookForm(this);
// ##     }
// ##     /**
// ##      * @param {BlockEditFormProps} props
// ##      * @access protected
// ##      */
// ##     render(_, {src}) {
// ##         return [
// ##             <FormGroup>
// ##                 <label htmlFor="src" class="form-label">{ __('Image file') }</label>
// ##                 <ImagePicker
// ##                     src={ src }
// ##                     onSrcCommitted={ this.emitNewSrc.bind(this) }
// ##                     inputId="src"
// ##                     ref={ this.imagePicker }/>
// ##             </FormGroup>,
// ##             <FormGroup labelFlow="break">
// ##                 <label htmlFor="altText" class="form-label with-icon" title={ __('Alt text') }>
// ##                     { __('Alt text') }
// ##                 </label>
// ##                 <div class="p-relative">
// ##                     <Textarea vm={ this } prop="altText" id="altText" rows="2" style="min-height:unset"/>
// ##                     <span
// ##                         class="tooltip tooltip-left p-absolute"
// ##                         data-tooltip={ __('The text that a browser displays\nif the image cannot be loaded') }
// ##                         style="right: .3rem; top: .3rem; z-index: 1">
// ##                         <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
// ##                     </span>
// ##                 </div>
// ##                 <InputErrors vm={ this } prop="altText"/>
// ##             </FormGroup>,
// ##             <FormGroup>
// ##                 <label htmlFor="caption" class="form-label with-icon" title={ __('Caption') }>
// ##                     { __('Caption') }
// ##                 </label>
// ##                 <Textarea vm={ this } prop="caption" id="caption" rows="2" style="min-height:unset"/>
// ##                 <InputErrors vm={ this } prop="caption"/>
// ##             </FormGroup>
// ##         ];
// ##     }
// ##     /**
// ##      * @param {String|null} src
// ##      * @param {String|null} _mime
// ##      */
// ##     emitNewSrc(src/*, _mime*/) {
// ##         this.props.emitValueChanged(src, 'src', false, env.normalTypingDebounceMillis);
// ##     }
// ## }
// ## 
// ## /**
// ##  * @param {String|null} src
// ##  * @returns {String}
// ##  */
// ## function completeSrc(src) {
// ##     if (!src)
// ##         return placeholderImageSrc;
// ##     const isLocal = src.indexOf('/') < 0;
// ##     if (isLocal)
// ##         return urlUtils.makeAssetUrl(`public/uploads/${src}`);
// ##     //
// ##     return (
// ##         // "/local-dir/img.jpg"
// ##         src[0] === '/' ||
// ##         // "https://foo.com/img.jpg"
// ##         src.split(':').length > 1
// ##     ) ? src : `//${src}`;
// ## }
// ## 
// ## export default () => {
// ##     const initialData = {
// ##         src: null,
// ##         altText: '',
// ##         caption: '',
// ##     };
// ##     const name = 'Image';
// ##     return {
// ##         name,
// ##         friendlyName: 'Image',
// ##         ownPropNames: Object.keys(initialData),
// ##         initialData,
// ##         defaultRenderer: 'sivujetti:block-auto',
// ##         icon: 'photo',
// ##         reRender({src, altText, caption, styleClasses, id}, renderChildren) {
// ##             return ['<figure class="j-', name, styleClasses ? ` ${styleClasses}` : '',
// ##                 '" data-block-type="', name,
// ##                 '" data-block="', id,
// ##                 '">',
// ##                     '<img src="', completeSrc(src), '"', ' alt="', altText , '">',
// ##                     caption ? `<figcaption>${caption}</figcaption>` : '',
// ##                 renderChildren(),
// ##             '</figure>'
// ##             ].join('');
// ##         },
// ##         createSnapshot: from => ({
// ##             src: from.src,
// ##             altText: from.altText,
// ##             caption: from.caption,
// ##         }),
// ##         editForm: ImageBlockEditForm,
// ##     };
// ## };
// ## 
// ## export {completeSrc};
