import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './include-internal/validation.fi.js';

stringBundles.push({
    'Page': 'Sivu',
    'Services': 'Palvelut',
    'Services#partitive': 'Palvelua',
    'Service': 'Palvelu',
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
    'Own styles': 'Omat tyylit',
    'Base styles': 'Pohjatyylit',
    'Use specializations': 'Käytä spesialisointeja',
    'If on, any changes made to this\nglobal content tree won\'t affect\nthe original': 'Jos päällä, tähän globaaaliin sisältö-\npuuhun tehdyt muutokset ei\nvaikuta alkuperäiseen',
    'Styles must contain at least one CSS-rule': 'Tyylit tulisi sisältää ainakin yhden CSS-säännön',
    // edit-app/src/BlockTree.jsx
    'Add child content': 'Lisää lapsisisältöä',
    'Clone': 'Kloonaa',
    'Clone content': 'Kloonaa sisältö',
    'Delete': 'Poista',
    'Delete content': 'Poista sisältö',
    'Convert to global': 'Muunna globaaliksi',
    'Convert to global content': 'Muunna globaaliksi sisällöksi',
    'Content tree': 'Sisältöpuu',
    // edit-app/src/BlockTrees.jsx
    'Add content to this page': 'Lisää sisältöä tähän sivuun',
    // edit-app/src/BlockTreeShowHelpPopup.jsx
    'todo.': 'Sivujetissä sivujen sisältö esitetään tällaisena puurakenteena: yksi puun rivi (tai haara) vastaa yhtä sivun osiota tai sisältöä. Voit järjestellä sivun eri osioita sisältöpuun rivejä raahaamalla. Voit lisätä sivuun uutta sisältää sisältöpuun yläpuolella olevasta "Lisää sisältöä tähän sivuun" -painikkeesta tai sisältöpuun rivien ●●● painikkeista.',
    'Colorless': 'Väritön',
    'Ordinary content, which don\'t have a background color, are ': 'Tavallinen sisältö, joilla ei ole taustaväriä, on ',
    'stored to this page only': 'tallennettu vain tähän sivuun',
    'Orange': 'Oranssi',
    'Global content (e.g. Header) references to a ': 'Globaali sisältö (esim. Header) viittaa ',
    'separately stored data': 'erillisesti tallennettuun tietoon',
    '. When you edit Header on one page, Headers on other pages changes.': '. Kun muokkaat yhden sivun Headeria, tieto tallentuu myös muiden sivujen Headereissa.',
    'Violet': 'Violetti',
    'Meta content contains ': 'Metasisältöön on tallennettu ',
    'additional data / metadata': 'lisä-, tai metatietoja',
    ', and otherwise act like ordinary content.': ', ja käyttäytyvät muilta osin kuten tavallinen sisältö.',
    // edit-app/src/BlockTypeBaseStylesTab.jsx
    'These styles will affect all %s content': 'Nämä tyylit vaikuuttaa kaikkiin %s-sisältöihin',
    // edit-app/src/BlockTypeSelector.jsx
    'Common': 'Yleiset',
    'Globals': 'Globaalit',
    'Cancel': 'Peruuta',
    // edit-app/src/ConvertBlockToGlobalBlockTreeDialog.jsx
    'Store this content globally so you can use it later in other pages?': 'Tallenna tämä sisältö globaalisti että voit käyttää sitä myöhemmin myös muilla sivuilla?',
    'Name': 'Nimi',
    'e.g. Header, Footer': 'esim. Header, Footer',
    'Convert': 'Muunna',
    // edit-app/src/DefaultView/GlobalStylesSection.jsx
    'Styles': 'Tyylit',
    'Colours and fonts': 'Sivuston värit ja fontit',
    // edit-app/src/DefaultView/OnThisPageSection.jsx
    'On this page': 'Tämä sivu',
    'Content of page %s': '%s -sivun sisältö',
    // edit-app/src/DefaultView/WebsiteSection.jsx
    'Website': 'Sivusto',
    'Content management': 'Sisällönhallinta',
    // edit-app/src/PageType/PageTypeCreateMainPanelView.jsx
    'page type': 'sivutyyppi',
    'Default content': 'Oletussisältö',
    'Settings': 'Tiedot',
    'Fields': 'Kentät',
    // edit-app/src/DefaultMainPanelView.jsx
    'My website': 'Sivustoni',
    'Pages': 'Sivut',
    'Pages#partitive': 'Sivua',
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
    'global content': 'globaalia sisältöä',
    // edit-app/src/IndividualBlockStylesTab.jsx
    'These styles will affect this individual content only': 'Nämä tyylit vaikuuttaa vain tähän yksittäiseen sisältöön',
    // edit-app/src/InspectorPanel.jsx
    'Close': 'Sulje',
    // edit-app/src/PageType/PageTypeBasicInfoConfigurationForm.jsx
    'Name (for computers)': 'Nimi (konekielinen)',
    'Name (plural)': 'Nimi (monikossa)',
    'Description': 'Kuvaus',
    'Listable': 'Listattava',
    'Default layout': 'Oletusivupohja',
    // edit-app/src/SaveButton.jsx
    'Undo latest change': 'Peruuta viimeisin muutos',
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
    // edit-app/src/block-types/code.js
    'Code': 'Koodi',
    'My code ...': 'Koodia ...',
    'Waits for configuration ...': 'Odottaa konfigurointia ...',
    // edit-app/src/block-types/columns.js
    'Columns': 'Sarakkeet',
    'Num columns': 'Sarakkeita',
    'Full width': 'Täysileveä',
    // edit-app/src/block-types/heading.js
    'Heading': 'Otsikko',
    'Level': 'Taso',
    'Add content after': 'Lisää sisältöä jälkeen',
    'Heading text': 'Otsikon teksti',
    // edit-app/src/block-types/image.js
    'Image': 'Kuva',
    // edit-app/src/block-types/listing.js
    'Listing': 'Listaus',
    'List': 'Listaa',
    'at most': 'enintään',
    'all': 'kaikki',
    'single': 'yksi',
    'Type amount': 'Syötä lukumääärä',
    '%s %s starts with': '%s %s alkaa kirjaimilla',
    'whose': 'joiden',
    'which': 'jonka',
    'blog': 'blogi',
    'and': 'ja',
    'ordered by': 'järjestäen ne',
    'newest to oldest': 'uusimmasta vanhimpaan',
    'oldest to newest': 'vanhimmasta uusimpaan',
    'randomly': 'satunnaisesti',
    'rendering %s using template': 'tulostaen %s templaatilla',
    'it': 'sen',
    'them': 'ne',
    'Add new %s': 'Lisää uusi %s',
    '%s must be a number': '%s tulisi olla numero',
    'This value': 'Tämä arvo',
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
