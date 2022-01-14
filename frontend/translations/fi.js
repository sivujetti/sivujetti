import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './include-internal/validation.fi.js';

stringBundles.push({
    // edit-app/src/AddPageMainPanelView.jsx
    'New page': 'Uusi sivu',
    'Create %s': 'Luo %s',
    'Cancel add %s': 'Peruuta %s luonti',
    'Back': 'Takaisin',
    'Layout': 'Sivupohja',
    'Default fields': 'Oletuskentät',
    'Title': 'Otsikko',
    'Slug': 'Url (slug)',
    'Content': 'Sisältö',
    'Something unexpected happened.': 'Jokin meni pieleen.',
    // edit-app/src/BlockEditForm.jsx
    'Specialize this global block': 'Spesialisoi tämä globaali lohko',
    'Specialize': 'Spesialisoi',
    'Use edited values on this\npage only': 'Käytä muokattuja tietoja\nvain tällä sivulla',
    // edit-app/src/BlockTree.jsx
    'Add child': 'Lisää lapsilohko',
    'Add child block': 'Lisää lapsilohko',
    'Clone': 'Kloonaa',
    'Clone block or branch': 'Kloonaa lohko tai haara',
    'Delete': 'Poista',
    'Delete block': 'Poista lohko',
    'Convert to global': 'Muunna globaaliksi',
    'Convert to global block': 'Muunna globaaliksi lohkoksi',
    'Block tree': 'Lohkopuu',
    // edit-app/src/BlockTrees.jsx
    'Add new block': 'Lisää uusi lohko',
    'Add block': 'Lisää lohko',
    // edit-app/src/BlockTreeShowHelpPopup.jsx
    'Sivujetti stores the data of each page to blocks. You can drag them around with a mouse, and todo.': 'Sivujetissä sivujen sisältö tallennetaan lohkoihin. Voit järjestellä niitä hiirellä raahaamalla, ja luoda niistä sisäkkäisiä rakenteita.',
    'Colorless': 'Väritön',
    'Ordinary blocks, which don\'t have a background color, are ': 'Tavalliset lohkot, joilla ei ole taustaväriä, on ',
    'stored to this page only': 'tallennettu vain tälle sivulle',
    'Orange': 'Oranssi',
    'A global block (e.g. Header) references to a ': 'Globaali lohko (esim. Header) viittaa ',
    'separately stored data': 'erillisesti tallennettuun tietoon',
    '. When you edit Header on one page, Headers on other pages changes.': '. Kun muokkaat yhden sivun Headeria, tieto tallentuu myös muiden sivujen Headereissa.',
    'Violet': 'Violetti',
    'Meta blocks contains ': 'Metalohkoihin on tallennettu ',
    'additional data / metadata': 'lisä-, tai metatietoja',
    ', and otherwise act like ordinary blocks.': ', ja käyttäytyvät muilta osin kuten tavalliset lohkot.',
    // edit-app/src/BlockTypeSelector.jsx
    'Common': 'Yleiset',
    'Globals': 'Globaalit',
    'Cancel': 'Peruuta',
    // edit-app/src/ConvertBlockToGlobalBlockTreeDialog.jsx
    'Store this block globally so you can use it later in other pages?': 'Tallenna tämä lohko globaalisti että voit käyttää sitä myöhemmin myös muilla sivuilla?',
    'Name': 'Nimi',
    'e.g. Header, Footer': 'esim. Header, Footer',
    'Convert': 'Muunna',
    // edit-app/src/DefaultMainPanelView.jsx
    'On this page': 'Tällä sivulla',
    'My website': 'Sivustoni',
    'Pages': 'Sivut',
    'Create page': 'Luo sivu',
    // edit-app/src/EditApp.jsx
    'Edit mode': 'Muokkaustila',
    'Page title': 'Sivuotsikko',
    // edit-app/src/GlobalBlockTreeSelector.jsx
    'No %s found': '%s ei löytynyt',
    'global blocks': 'globaaleja lohkoja',
    // edit-app/src/InspectorPanel.jsx
    'Close': 'Sulje',
    // edit-app/src/SaveButton.jsx
    'Save changes': 'Tallenna muutokset',
    // edit-app/src/block-types/Menu/EditItemPanel.jsx
    'Text': 'Teksti',
    'Url': 'Urli',
    // edit-app/src/block-types/Menu/menu.js
    'Menu': 'Valikko',
    'Add item': 'Lisää linkki',
    'Link text': 'Linkin teksti',
    'Home': 'Etusivu',
    'About': 'Meistä',
    // edit-app/src/block-types/button.js
    'Button': 'Nappi',
    'Link': 'Linkki',
    'Css classes': 'Css-luokat',
    'Button text': 'Napin teksti',
    // edit-app/src/block-types/columns.js
    'Columns': 'Sarakkeet',
    'Num columns': 'Sarakkeita',
    'Full width': 'Täysileveä',
    // edit-app/src/block-types/heading.js
    'Level': 'Taso',
    'Add block after': 'Lisää lohko jälkeen',
    'Heading text': 'Otsikon teksti',
    'Heading': 'Otsikko',
    // edit-app/src/block-types/image.js
    'Image': 'Kuva',
    // edit-app/src/block-types/listing.js
    'A list of %s': 'Lista %s:ja',
    'Add new %s': 'Lisää uusi %s',
    // edit-app/src/block-types/pageInfo.js
    'PageInfo': 'Metatiedot',
    'Url (slug)': 'Urli (slug)',
    // edit-app/src/block-types/paragraph.js
    'Paragraph': 'Tekstikappale',
    'Paragraph text': 'Tekstikappaleen teksti',
    // edit-app/src/block-types/richText.js
    'RichText': 'Rikasteteksti',
    'Rich text': 'Rikasteteksti',
    'Rich text content': 'Rikastettua tekstiä',
    // edit-app/src/block-types/section.js
    'Section': 'Osio',
    'Background': 'Taustakuva',
    // edit-app/src/BlockWidget/ImagePicker.jsx
    'Choose a picture': 'Valitse kuva',
    //edit-app/src/Upload/UploadButton.jsx
    'File name': 'Tiedostonimi',
    'Upload picture': 'Lataa kuva',
    'File extension not supported': 'Tiedostopääte ei kelpaa',
    'File size must not exceed %dMB': 'Tiedosto saa olla enintään %dMB',
    'Failed to upload image': 'Kuvan lataus epäonnistui',
    //edit-app/src/Upload/UploadsManager.jsx
    'Documents': 'Tiedostot',
    'Images': 'Kuvat',
    'Upload': 'Lataa',
    'Search': 'Hae',
    'No results for "%s"': 'Ei tuloksia hakusanalla "%s"',
    'No uploads yet': 'Ei vielä latauksia',
}, validationStrings);
