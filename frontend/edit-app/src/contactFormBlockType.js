import {__} from './temp.js';
import services from './services.js';

const todoIsBlockSavedToBackend = (_blockRef, blockData) =>
    !blockData.id.startsWith('new-')
;

const contactFormBlockReRender = (newDataFromForm, blockRef, prevData) => {
    if (todoIsBlockSavedToBackend(blockRef, prevData)) {
        // ??
        return;
    }
    blockRef.tryToReRenderWithHtml(`<p>${__('Loading')} ...</p>`);
    services.http.post('/api/defaults/contact-form/render-template/form', {fields:newDataFromForm.fields})
        .then(resp => blockRef.tryToReRenderWithHtml(resp.html))
        .catch(window.console.error);
};

const t = () => ({
    subjectTemplate: __('Uusi yhteydenotto sivustolta [siteName]'),
    toAddress: 'sivuston-omistaja@mail.com',
    fromAddress: 'no-reply@sivuston-nimi.com',
    bodyTemplate:
        `${__('Uusi yhteydenotto sivustolta')} [siteName].\n\n${__('Lähettäjä')}:\n[name]\n${__('Email')}:\n[email]\n${__('Viesti')}:\n[message]\n\n------------\n${__('(Tämä viesti lähetettiin Forms-lisäosalla)')}\n`
});

const contactFormBlockGetInitialData = () => ({ // ??
    fields: `[{"label":"${__('Name')}","type":"text","isRequired":true},` +
             `{"label":"${__('Email')}","type":"email","isRequired":true},` +
             `{"label":"${__('Message')}","type":"textarea","isRequired":false}]`,
    behaviours: JSON.stringify([{name: 'SendMail', data: t()}])
});

// todo add form type pre-selector (contact form, rsvp form)
class CreateContactFormBlockFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.fields = JSON.parse(props.blockData.fields);
        this.state = {text: props.blockData.text, curE: null};
    }
    render(_, {curE}) {
        return <div>
            <ul class="tab" style="min-width: 200px;">
            <li class="tab-item active">
                <a href="" onClick={ e => e.preventDefault() } class="active">{ __('Fields') }</a>
            </li>
            <li class="tab-item">
                <a href="" onClick={ e => e.preventDefault() }>{ __('Settings') }</a>
            </li>
            </ul>
            { !curE ?
            <div>{ this.fields.map(f => {
                return <div class="columns">
                    <div class="column"><button onClick={ () => this.editField(f) } type="button">{ f.type }</button></div>
                    <div class="column"><button onClick={ () => this.deleteField(f) } type="button">x</button></div>
                </div>;
            }) }</div> :
            <div><div>
                <button class="btn btn-link btn-sm" type="button" onClick={ () => this.setState({curE: null}) }>&lt; Back</button>
                <div class="form-group">
                <label class="form-label" htmlFor="input-example-1">Label</label>
                <input class="form-input" type="text" id="input-example-1" value="Name" placeholder="Label"/>
                </div>
                <div class="form-group">
                <label class="form-switch">
                    <input type="checkbox"/>
                    <i class="form-icon"></i> Is required?
                </label>
                </div>
            </div></div>
            }
        </div>;
    }
    applyLatestValue() {
        //
    }
    editField(f) {
        this.setState({curE: f});
    }
    deleteField(f) {
        const mut = this.fields.filter(f2 => f2 !== f);
        this.props.onValueChanged(Object.assign({fields: JSON.stringify(mut)},
                                                this.props.blockData));
    }
}

class EditContactFormBlockFormInputs extends CreateContactFormBlockFormInputs { }

const blockType = {
    reRender: contactFormBlockReRender,
    getInitialData: contactFormBlockGetInitialData,
    EditFormImpl: CreateContactFormBlockFormInputs,
    CreateFormImpl: EditContactFormBlockFormInputs,
    friendlyName: 'ContactForm',
    defaultRenderer: 'kuura:auto',
};

export default blockType;
