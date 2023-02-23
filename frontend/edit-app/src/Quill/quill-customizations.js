import {__, env, urlUtils, iconAsString, stringUtils} from '@sivujetti-commons-for-edit-app';
import {determineModeFromPreview} from './common.js';

const Quill = window.Quill;

class MySnowTheme extends Quill.import('themes/snow') {
    // sivujettiApi;
    /**
     * @inheritdoc
     */
    constructor(quill, options) {
        super(quill, options);
        this.sivujettiApi = options.sivujettiApi;
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
        el.insertBefore(myPreviewLink, el.firstElementChild);
        el.insertBefore(myPreviewTitle, el.firstElementChild);

        const origShow = this.tooltip.show;
        this.tooltip.show = (...args) => {
            const linkEl = this.tooltip.preview;
            let noOrigin, urlPreview;
            if (linkEl.host === window.location.host) {
                noOrigin = linkEl.href.substring(linkEl.origin.length);
                urlPreview = determineModeFromPreview(noOrigin)[0] === 'pick-url'
                    ? noOrigin.substring(urlUtils.baseUrl.length - 1)
                    : `public/uploads/${noOrigin.split('/public/uploads/')[1]}`;
            } else {
                noOrigin = !linkEl.href.startsWith('//') ? linkEl.href : linkEl.href.substring('//'.length);
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
            myPreviewLink.href = linkEl.href;
            myPreviewLink.title = linkEl.href;
            myPreviewLink.target = '_blank';
            myPreviewLink.textContent = urlPreview;
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
        const wrapperSpan = document.createElement('span');
        wrapperSpan.className = 'ql-picker ql-id-anchor-picker';
        const createElementUsing = html => {
            const tmp = document.createElement('div'); tmp.innerHTML = html; return tmp.firstElementChild;
        };
        const doClose = () => {
            if (wrapperSpan.classList.contains('ql-expanded')) wrapperSpan.classList.remove('ql-expanded');
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

                const input = document.createElement('input');
                input.className = 'form-input tight ml-1';
                input.style.minWidth = '7rem';
                inputWrap.appendChild(input);

                const clearIdBtn = createElementUsing('<button class="sivujetti-form-icon btn no-color mr-1" type="button" style="display: none;"><svg class="icon-tabler size-xs color-dimmed" width="24" height="24"><use href="/sivujetti/public/sivujetti/assets/tabler-sprite-custom.svg#tabler-x"></use></svg></button>');
                clearIdBtn.addEventListener('click', () => {
                    input.value = '';
                    clearIdBtn.style.display = 'none';
                });
                inputWrap.appendChild(clearIdBtn);

                innerSpan.appendChild(inputWrap);
            // }

            const applyIdSpanBtn = createElementUsing('<span role="button" tabindex="0" class="btn btn-sm">Ok</span>');
            applyIdSpanBtn.addEventListener('click', () => {
                const val = input.value ? stringUtils.slugify(input.value) : '';
                if (val === appliedVal) { doClose(); return; }
                this.quill.format('id-anchor', val || null);
                if (val) clearIdBtn.style.display = 'block';
                doClose();
            });
            innerSpan.appendChild(applyIdSpanBtn);

            const cancelChangesSpanBtn = createElementUsing(`<span role="button" tabindex="0" class="btn btn-sm btn-link">${__('Peruuta')}</span>`);
            cancelChangesSpanBtn.addEventListener('click', doClose);
            innerSpan.appendChild(cancelChangesSpanBtn);

            wrapperSpan.appendChild(innerSpan);
        // }

        mainToolbarButton.parentNode.insertBefore(wrapperSpan, mainToolbarButton);

        mainToolbarButton.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const curval = this.quill.getFormat()['id-anchor'];
            input.value = curval || '';
            if (curval) clearIdBtn.style.display = 'block';
            appliedVal = curval;
            wrapperSpan.classList.add('ql-expanded');
            return false;
        }, true);

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
        const isLocal = value.startsWith('/') && !value.startsWith('//');
        if (isLocal && node.host === env.window.location.host) {
            node.removeAttribute('rel');
            node.removeAttribute('target');
            addOriginToHrefOf(node);
        }
        return node;
    }
    /**
     * @inheritdoc
     */
    static sanitize(url) {
        const anchor = document.createElement('a');
        anchor.href = url;
        const protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
        return protocol ? url : this.SANITIZED_URL;
    }
    /**
     * @inheritdoc
     */
    format(name, value) {
        super.format(name, value);
        if (value && value.startsWith('/') && !value.startsWith('//') && this.domNode.host === env.window.location.host) {
            addOriginToHrefOf(this.domNode);
        }
    }
}

/**
 * @param {HTMLAnchorElement} linkEl
 */
function addOriginToHrefOf(linkEl) {
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
