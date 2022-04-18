import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './include-internal/validation.fi.js';

stringBundles.push({
    // edit-app/src/Page/PageCreateMainPanelView.jsx
    'Create %s': 'Luo %s',
    'Cancel add %s': 'Peruuta %s luonti',
    'Back': 'Takaisin',
    'Layout': 'Sivupohja',
    'Add to menu': 'Lisää valikkoon',
    'Title': 'Otsikko',
    'Slug': 'Url (slug)',
    'Content': 'Sisältö',
    'Page "%s" already exist.': 'Sivu "%s" on jo olemassa.',
    'Something unexpected happened.': 'Jokin meni pieleen.',
    // edit-app/src/BlockEditForm.jsx
    'Styles': 'Tyylit',
    'Specialize this global block': 'Spesialisoi tämä globaali lohko',
    'Specialize': 'Spesialisoi',
    'Use edited values on this\npage only': 'Käytä muokattuja tietoja\nvain tällä sivulla',
    'Styles must contain at least one CSS-rule': 'Tyylit tulisi sisältää ainakin yhden CSS-säännön',
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
    // edit-app/src/DefaultView/GlobalStylesSection.jsx
    'Block types': 'Lohkotyypit',
    // edit-app/src/PageType/PageTypeCreateMainPanelView.jsx
    'page type': 'sivutyyppi',
    'Default content': 'Oletussisältö',
    'Settings': 'Tiedot',
    'Fields': 'Kentät',
    // edit-app/src/DefaultMainPanelView.jsx
    'On this page': 'Tällä sivulla',
    'My website': 'Sivustoni',
    'Pages': 'Sivut',
    'page': 'sivu',
    'Global styles': 'Globaalit tyylit',
    // edit-app/src/EditApp.jsx
    'Edit mode': 'Muokkaustila',
    'Exit edit mode': 'Poistu muokkaustilasta',
    'Go to dashboard': 'Siirry dashboardiin',
    'Log out': 'Kirjaudu ulos',
    'Created new %s': 'Luotiin uusi %s',
    'Page title': 'Sivuotsikko',
    // edit-app/src/GlobalBlockTreeSelector.jsx
    'No %s found': '%s ei löytynyt',
    'global blocks': 'globaaleja lohkoja',
    // edit-app/src/InspectorPanel.jsx
    'Close': 'Sulje',
    // edit-app/src/PageType/PageTypeBasicInfoConfigurationForm.jsx
    'Name (for computers)': 'Nimi (konekielinen)',
    'Name (plural)': 'Nimi (monikossa)',
    'Description': 'Kuvaus',
    'Listable': 'Listattava',
    'Default layout': 'Oletusivupohja',
    // edit-app/src/SaveButton.jsx
    'Save changes': 'Tallenna muutokset',
    // edit-app/src/block-types/Menu/EditForm.jsx
    'Add link': 'Lisää linkki',
    'Edit': 'Muokkaa',
    'Edit link': 'Muokkaa linkkiä',
    'Delete link': 'Poista linkki',
    // edit-app/src/block-types/Menu/EditItemPanel.jsx
    'Link text': 'Linkin teksti',
    'Url': 'Urli',
    'e.g. %s or %s': 'esim. %s tai %s',
    // edit-app/src/block-types/Menu/menu.js
    'Menu': 'Valikko',
    'Home': 'Etusivu',
    'About': 'Meistä',
    // edit-app/src/block-types/button.js
    'Button': 'Nappi',
    'Link element': 'Linkkielementti',
    'Normal button': 'Nappi',
    'Submit button': 'Lähetä-nappi',
    'Link': 'Linkki',
    'Css classes': 'Css-luokat',
    'Tag type': 'Elementin tyyppi',
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
    'Listing': 'Listaus',
    'todo1': 'Sivutyyppi, jota listataan',
    'List': 'Listaa',
    'todo2': 'Templaatti, jota käytetään\nlistauksessa',
    'Renderer': 'Ulkoasu',
    'Add new %s': 'Lisää uusi %s',
    // edit-app/src/block-types/pageInfo.js
    'PageInfo': 'Metatiedot',
    'Url (slug)': 'Urli (slug)',
    'Meta description': 'Meta-selostus',
    // edit-app/src/block-types/paragraph.js
    'Paragraph': 'Tekstikappale',
    'Text': 'Teksti',
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
