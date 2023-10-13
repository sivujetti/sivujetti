import {__, env, iconAsString, stringUtils} from '@sivujetti-commons-for-edit-app';
import {determineModeFromPreview, normalizeUrl, getVisibleSlug} from './common.js';

const Quill = window.Quill;

class MySnowTheme extends Quill.import('themes/snow') {
    // sivujettiApi;
    // handleMouseUpOutsideWindow;
    /**
     * @inheritdoc
     */
    constructor(quill, options) {
        super(quill, options);
        this.sivujettiApi = options.sivujettiApi;
        this.handleMouseUpOutsideWindow = () => {
            if (this.quill.selection.mouseDown)
                this.quill.selection.update(Quill.sources.USER);
        };
        window.addEventListener('mouseup', this.handleMouseUpOutsideWindow);
    }
    /**
     * @access public
     */
    destroy() {
        window.removeEventListener('mouseup', this.handleMouseUpOutsideWindow);
    }
    /**
     * @inheritdoc
     */
    extendToolbar(toolbar) {
        super.extendToolbar(toolbar);
        this.buildIdPicker(toolbar.container);
        //
        const el = this.tooltip.root;
        const [editLink, deleteLink] = [el.lastChild.previousSibling, el.lastChild];
        if (!editLink.classList.contains('btn')) {
            editLink.textContent = __('Edit');
            deleteLink.textContent = __('Delete');
            editLink.classList.add('btn', 'btn-sm');
            deleteLink.classList.add('btn', 'btn-sm', 'ml-1');
        }

        const originalPreviewEl = this.tooltip.preview;
        originalPreviewEl.style.display = 'none';
        const myPreviewTitle = document.createElement('div');
        myPreviewTitle.className = 'flex-centered';
        const myPreviewLink = document.createElement('a');
        myPreviewLink.className = 'd-block text-ellipsis my-1';
        const altPreviewEl = document.createElement('span');
        altPreviewEl.className = `${myPreviewLink.className} d-none`;
        el.insertBefore(altPreviewEl, el.firstElementChild);
        el.insertBefore(myPreviewLink, el.firstElementChild);
        el.insertBefore(myPreviewTitle, el.firstElementChild);

        const origShow = this.tooltip.show;
        this.tooltip.show = (...args) => {
            const linkEl = this.tooltip.preview;
            let previewEl, noOrigin, urlPreview;

            if (linkEl.host === window.location.host) {
                const isHashOnly = linkEl.href.indexOf('/_edit#') > -1;
                if (isHashOnly || linkEl.href.endsWith('/_edit')) {
                    noOrigin = '/doesnt-matter';
                    urlPreview = isHashOnly
                        ? `#${linkEl.href.split('#')[1]}` // 'https://domain.com/index.php?q=/_edit#foo' -> '#foo'
                        : getVisibleSlug('');
                    //
                    previewEl = altPreviewEl;
                    showOrHideEls(previewEl, myPreviewLink);
                } else {
                    noOrigin = linkEl.href.substring(linkEl.origin.length);
                    urlPreview = normalizeUrl(noOrigin, determineModeFromPreview(noOrigin)[0]);
                    //
                    previewEl = myPreviewLink;
                    showOrHideEls(previewEl, altPreviewEl);
                }
            } else {
                previewEl = myPreviewLink;
                showOrHideEls(previewEl, altPreviewEl);
                noOrigin = normalizeUrl(linkEl.href, 'type-external-url');
                urlPreview = noOrigin;
            }
            const [mode, title] = determineModeFromPreview(noOrigin);
            const icon = {
                'pick-url': 'file',
                'pick-file': 'photo',
                'type-external-url': 'external-link',
            }[mode];
            myPreviewTitle.innerHTML = iconAsString(icon, 'size-xs color-dimmed3 mr-1') +
                `<span class="col-mr-auto">${title}</span>`;
            if (previewEl.nodeName === 'A') {
                previewEl.href = linkEl.href;
                previewEl.title = linkEl.href;
                previewEl.target = '_blank';
            }
            previewEl.textContent = urlPreview;
            return origShow.call(this.tooltip, ...args);
        };

        //
        const origEdit = this.tooltip.edit;
        this.tooltip.edit = (p1 = undefined, p2 = undefined, p3 = undefined) => {
            const mode = p1 || 'link';
            if (mode === 'link') {
                const linkEl = this.tooltip.preview;
                const url = p2 ? linkEl.host !== window.location.host
                    ? linkEl.href
                    : linkEl.href.substring(linkEl.origin.length) : '';
                const preview = p3 || null;
                this.tooltip.hide();
                this.sivujettiApi.openUrlPicker(preview, url);
                return;
            }
            return origEdit.call(this.tooltip, p1, p2);
        };

        const origPosition = this.tooltip.position;
        this.tooltip.position = reference =>
            origPosition.call(this.tooltip, Object.assign({}, reference, {left: 0}))
        ;
    }
    /**
     * @inheritdoc
     */
    buildPickers(selects, icons) {
        super.buildPickers(selects, icons);
        const headingPicker = this.pickers.find(({select}) => select.classList.contains('ql-header'));
        if (!headingPicker) return;
        const {label, options} = headingPicker;
        label.setAttribute('data-h1-translated', `${__('Heading')} 1`);
        label.setAttribute('data-h2-translated', `${__('Heading')} 2`);
        label.setAttribute('data-h3-translated', `${__('Heading')} 3`);
        label.setAttribute('data-h4-translated', `${__('Heading')} 4`);
        label.setAttribute('data-h5-translated', `${__('Heading')} 5`);
        label.setAttribute('data-h6-translated', `${__('Heading')} 6`);
        label.setAttribute('data-p-translated', __('Paragraph'));
        Array.from(options.children).forEach(el => {
            const level = el.getAttribute('data-value');
            el.setAttribute('data-label-translated', level ? `${__('Heading')} ${level}` : __('Paragraph'));
        });
    }
    /**
     * @access private
     */
    buildIdPicker(cont) {
        const mainToolbarButton = cont.querySelector('.ql-id-anchor');
        if (!mainToolbarButton) return; // not defined in toolbar config

        let appliedVal;
        let clearIdBtn;
        let input;
        const wrapperSpan = document.createElement('span');
        wrapperSpan.className = 'ql-picker ql-id-anchor-picker';
        const createElementUsing = html => {
            const tmp = document.createElement('div'); tmp.innerHTML = html; return tmp.firstElementChild;
        };
        const doClose = () => {
            if (wrapperSpan.classList.contains('ql-expanded')) wrapperSpan.classList.remove('ql-expanded');
        };
        const doApplyId = (wait = false) => {
            const val = input.value ? stringUtils.slugify(input.value) : '';
            if (val === appliedVal) { doClose(); return; }
            const applyNewVal = () => {
                this.quill.format('id-anchor', val || null);
                if (val) clearIdBtn.style.display = 'block';
                doClose();
            };
            if (!wait) applyNewVal(); else setTimeout(applyNewVal, 10);
        };

        // {
            const innerSpan = document.createElement('span');
            innerSpan.className = 'ql-picker-options';

            // {
                innerSpan.appendChild(createElementUsing(`<label class="d-block color-dimmed">${__('Anchor')}:</label>`));

                //
                const inputWrap = document.createElement('span');
                inputWrap.className = 'has-icon-right d-flex flex-centered my-1';

                inputWrap.appendChild(document.createTextNode('#'));

                input = document.createElement('input');
                input.className = 'form-input tight ml-1';
                input.style.minWidth = '7rem';
                inputWrap.appendChild(input);
                input.addEventListener('keydown', ({key}) => { if (key === 'Enter') doApplyId(true); });

                const svg = iconAsString('x', 'color-dimmed').replace('color-dimmed"', 'color-dimmed" style="margin: 0; position: static;"');
                clearIdBtn = createElementUsing(`<button class="sivujetti-form-icon btn no-color mr-1" type="button" style="display: none;top: 2px;">${svg}</button>`);
                clearIdBtn.addEventListener('click', () => {
                    input.value = '';
                    clearIdBtn.style.display = 'none';
                });
                inputWrap.appendChild(clearIdBtn);

                innerSpan.appendChild(inputWrap);
            // }

            const doApplyIdSpanBtn = createElementUsing('<span role="button" tabindex="0" class="btn btn-sm">Ok</span>');
            doApplyIdSpanBtn.addEventListener('click', doApplyId);
            innerSpan.appendChild(doApplyIdSpanBtn);

            const cancelChangesSpanBtn = createElementUsing(`<span role="button" tabindex="0" class="btn btn-sm btn-link">${__('Peruuta')}</span>`);
            cancelChangesSpanBtn.addEventListener('click', doClose);
            innerSpan.appendChild(cancelChangesSpanBtn);

            wrapperSpan.appendChild(innerSpan);
        // }

        mainToolbarButton.parentNode.insertBefore(wrapperSpan, mainToolbarButton);

        if (navigator.userAgent.indexOf('Chrome') > -1) {
        mainToolbarButton.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const curval = this.quill.getFormat()['id-anchor'];
            input.value = curval || '';
            if (curval) clearIdBtn.style.display = 'block';
            appliedVal = curval;
            wrapperSpan.classList.add('ql-expanded');
            input.focus();
            return false;
        }, true);
        } else {
        const tmp = document.createElement('div');
        tmp.innerHTML = mainToolbarButton.outerHTML;
        const mainBtnClone = tmp.firstElementChild;
        mainToolbarButton.parentNode.insertBefore(mainBtnClone, mainToolbarButton);

        mainToolbarButton.style.position = 'fixed';
        mainToolbarButton.style.left = '-200000px';
        document.body.insertBefore(mainToolbarButton, document.body.children[0]);

        const observer = new MutationObserver((mutationList, _observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'attributes' &&
                    mutation.attributeName === 'class' &&
                    mutation.target.className !== mainBtnClone.className)
                    mainBtnClone.className = mutation.target.className;
            }
        });
        observer.observe(mainToolbarButton, {attributes: true, childList: false, subtree: false});

        mainBtnClone.addEventListener('click', () => {
            setTimeout(() => {
            const curval = this.quill.getFormat()['id-anchor'];
            input.value = curval || '';
            if (curval) clearIdBtn.style.display = 'block';
            appliedVal = curval;
            wrapperSpan.classList.add('ql-expanded');
            input.focus();
            }, 10);
        });
        }

        // Add fake picker so quill can close it
        this.pickers.push({
            container: wrapperSpan,
            close: doClose,
            update() {
                // Do nothing
            }
        });
    }
}
MySnowTheme.DEFAULTS.modules.toolbar.handlers.link = function (value) {
    const {quill} = this;
    if (value) {
        const range = quill.getSelection();
        if (range == null || range.length == 0) return;
        const preview = quill.getText(range);
        quill.theme.tooltip.edit('link', '', preview);
    } else {
        quill.format('link', false);
    }
};

/**
 * @param {HTMLElement} toShow
 * @param {HTMLElement} toHide
 */
function showOrHideEls(toShow, toHide) {
    toShow.classList.remove('d-none');
    toHide.classList.add('d-none');
}

////////////////////////////////////////////////////////////////////////////////

const Delta = Quill.import('delta');
class MyClipboard extends Quill.import('modules/clipboard') {
    /**
     * @inheritdoc
     */
    onPaste(e) {
        // https://github.com/quilljs/quill/blob/d462f8000ffbaa3aab853809fb08f7809f828475/modules/clipboard.js#L178
        if (e.defaultPrevented || !this.quill.isEnabled()) return;
        e.preventDefault();
        const range = this.quill.getSelection(true);
        if (range == null) return;
        // https://github.com/quilljs/quill/issues/1298#issuecomment-403657657
        const text = e.clipboardData.getData('text/plain');
        const delta = new Delta()
            .retain(range.index)
            .delete(range.length)
            .insert(text);
        const index = text.length + range.index;
        const length = 0;
        this.quill.updateContents(delta, Quill.sources.USER);
        this.quill.setSelection(index, length, Quill.sources.SILENT);
        this.quill.scrollIntoView();
    }
}

////////////////////////////////////////////////////////////////////////////////

const Keyboard = Quill.import('modules/keyboard');
class MyKeyboard extends Keyboard { }
MyKeyboard.DEFAULTS = Object.assign({}, Keyboard.DEFAULTS, {
    bindings: Object.assign({}, Keyboard.DEFAULTS.bindings, {
        ['list autofill']: undefined
    })
});

////////////////////////////////////////////////////////////////////////////////

// https://codepen.io/anon/pen/GNMXZa
class MyLink extends Quill.import('formats/link') {
    /**
     * @inheritdoc
     */
    static create(value) {
        const node = super.create(value);
        const isEmpty = value === '-';
        const isLocal = isEmpty || (value.startsWith('/') && !value.startsWith('//') && node.host === env.window.location.host);
        if (isLocal) {
            node.removeAttribute('rel');
            node.removeAttribute('target');
            if (!isEmpty)
                addOrReplaceHrefAttrsPatch(node);
        }
        return node;
    }
    /**
     * @inheritdoc
     */
    static sanitize(url) {
        const anchor = document.createElement('a');
        const norm = url !== '-' ? url : '';
        anchor.href = url;
        if (norm === '') return norm;
        const protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
        return protocol ? url : this.SANITIZED_URL;
    }
    /**
     * @inheritdoc
     */
    format(name, value) {
        super.format(name, value);
        const isLocal = this.domNode.host === env.window.location.host;
        // Local link turned to external -> clear 'data-href-original'
        if (this.domNode.getAttribute('data-href-original') && !isLocal) {
            this.domNode.removeAttribute('data-href-original');
        } else if (value && value.startsWith('/') && !value.startsWith('//') && isLocal) {
            addOrReplaceHrefAttrsPatch(this.domNode);
        }
    }
}

/**
 * @param {HTMLAnchorElement} linkEl
 */
function addOrReplaceHrefAttrsPatch(linkEl) {
    const urlNoOrigin = linkEl.getAttribute('href');
    linkEl.setAttribute('data-href-original', urlNoOrigin);
    linkEl.setAttribute('href', linkEl.origin + urlNoOrigin);
}

////////////////////////////////////////////////////////////////////////////////

const Parchment = Quill.import('parchment');
const IdAttributor = new Parchment.Attributor.Attribute('id-anchor', 'id', {
    scope: Parchment.Scope.BLOCK
});

export {MySnowTheme, MyClipboard, MyKeyboard, MyLink, IdAttributor};
