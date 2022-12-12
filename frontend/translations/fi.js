import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './include-internal/validation.fi.js';

stringBundles.push({
    'Page': 'Sivu',
    'New page': 'Uusi sivu',
    'Categories': 'Kategoriat',
    'Services': 'Palvelut',
    'Services#partitive': 'Palvelua',
    'Service': 'Palvelu',
    // edit-app/src/left-column/block/BlockDnDSpawner.jsx
    'Start adding content': 'Aloita lisäämään sisältöä',
    'reusable content': 'uudelleenkäytettävä sisältö',
    'unique content': 'uniikki sisältö',
    'Filter': 'Suodata',
    // edit-app/src/left-column/block/BlockStylesTab.jsx
    'Use style': 'Käytä tyyliä',
    'No own styles': 'Ei omia tyylejä',
    'Show parent styles': 'Näytä ulommat tyylit',
    'Add styles': 'Lisää tyyli',
    'Edit name': 'Muokkaa nimeä',
    'Delete style': 'Poista tyyli',
    'Css for the outermost %s (%s)': 'Uloimman %s (%s) css',
    'element': 'elementin',
    'wrapper-element': 'wräpperielementin',
    'Css for the inner elements': 'Sisempien elementtien css',
    'Other classes': 'Muut luokat',
    'Style name': 'Tyylin nimi',
    // edit-app/src/left-column/page/AddCategoryPanel.jsx
    'Category': 'Kategoria',
    'New category name': 'Kategorian nimi',
    'Create category': 'Luo kategoria',
    // edit-app/src/Page/PageCreateMainPanelView.jsx
    'Create %s': 'Luo %s',
    'Cancel create %s': 'Peruuta %s luonti',
    'Back': 'Takaisin',
    'Layout': 'Sivupohja',
    'Add to menu': 'Lisää valikkoon',
    'Title': 'Otsikko',
    'Slug': 'Url (slug)',
    'Content': 'Sisältö',
    'Page "%s" already exist.': 'Sivu "%s" on jo olemassa.',
    'Something unexpected happened.': 'Jokin meni pieleen.',
    // edit-app/src/right-column/page/PagesListView.jsx
    'Duplicate page': 'Monista sivu',
    // edit-app/src/quill/*
    'Image': 'Kuva',
    'External': 'Ulkoinen',
    'website.com': 'sivusto.com',
    'Choose link type': 'Valitse linkin tyyppi',
    'Pick a page': 'Valitse sivu',
    'Pick an image': 'Valitse kuva',
    'Type an address': 'Kirjoita osoite',
    'Link to a page: ': 'Linkki sivuun: ',
    'Link to an image: ': 'Linkki kuvaan: ',
    'Link to an address: ': 'Linkki osoitteeseen: ',
    // edit-app/src/left-column/block/BlockEditForm.jsx
    'Styles': 'Tyylit',
    'Styles must contain at least one CSS-rule': 'Tyylit tulisi sisältää ainakin yhden CSS-säännön',
    // edit-app/src/left-column/block/BlockTree.jsx
    'Add child content': 'Lisää lapsisisältöä',
    'Duplicate': 'Monista',
    'Duplicate content': 'Monista sisältö',
    'Delete': 'Poista',
    'Delete content': 'Poista sisältö',
    'Save as reusable': 'Tallenna uudelleenkäytettäväksi',
    'Save as reusable content': 'Tallenna uudelleenkäytettäväksi sisällöksi',
    'Content tree': 'Sisältöpuu',
    // edit-app/src/popups/BlockTreeShowHelpPopup.jsx
    'todo1': 'Sivujetissä sivujen sisältö esitetään tällaisena puurakenteena: yksi puun rivi tai haara vastaa yhtä sivun osiota tai sisältöä. Voit ',
    'todo2': 'järjestellä',
    'todo3': ' sivun eri osioita sisältöpuun rivejä raahaamalla. Voit aloittaa ',
    'todo4': 'lisäämään sisältöä',
    'todo5': ' -napista',
    'todo6': ' sivun vasemmalla reunalla.',
    'Colorless': 'Väritön',
    'Ordinary content, which don\'t have a background color, are ': 'Tavallinen sisältö, joilla ei ole taustaväriä, on ',
    'stored to this page only': 'tallennettu vain tähän sivuun',
    'Orange': 'Oranssi',
    'todo8': 'Uniikki sisältö viittaa ',
    'todo9': 'erillisesti tallennettuun tietoon',
    'todo10': '. Kun muokkaat uniikkia sisältöä yhdellä sivulla, tieto vaihtuu kaikkien sivujen vastaavissa sisällöissä.',
    'Violet': 'Violetti',
    'Meta content contains ': 'Metasisältöön on tallennettu ',
    'additional data / metadata': 'lisä-, tai metatietoja',
    ', and otherwise act like ordinary content.': ', ja käyttäytyvät muilta osin kuten tavallinen sisältö.',
    // edit-app/src/left-column/default-panel-sections/BaseStylesSection.jsx
    'Colours and fonts': 'Sivuston värit ja fontit',
    'Visual': 'Visuaalinen',
    'Code': 'Koodi',
    // edit-app/src/left-column/default-panel-sections/OnThisPageSection.jsx
    'Duplicate this page': 'Monista tämä sivu',
    'On this page': 'Tämä sivu',
    'Content of page %s': '%s -sivun sisältö',
    'New page content': 'Uuden sivun sisältö',
    // edit-app/src/left-column/default-panel-sections/SettingsSection.jsx
    'Settings': 'Asetukset',
    'Website\'s settings': 'Sivuston asetukset',
    'Edit info': 'Muokkaa perustietoja',
    // edit-app/src/left-column/default-panel-sections/WebsiteSection.jsx
    'Website': 'Sivusto',
    'Content management': 'Sisällönhallinta',
    'page': 'sivu',
    //edit-app/src/left-column/page-type/PageTypeCreatePanel.jsx
    'page type': 'sivutyyppi',
    'Default content': 'Oletussisältö',
    'Basic settings': 'Perustiedot',
    'Fields': 'Kentät',
    // _
    'Pages': 'Sivut',
    'Pages#partitive': 'Sivua',
    // edit-app/src/EditApp.jsx
    'Edit mode': 'Muokkaustila',
    'Hide edit menu': 'Piilota muokkausvalikko',
    'Go to dashboard': 'Siirry dashboardiin',
    'Log out': 'Kirjaudu ulos',
    'Created new %s': 'Luotiin uusi %s',
    'Page title': 'Sivuotsikko',
    // edit-app/src/.jsx
    'No %s found': '%s ei löytynyt',
    // edit-app/src/InspectorPanel.jsx
    'Close': 'Sulje',
    // edit-app/src/left-column/page-type/PageTypeBasicInfoConfigurationForm.jsx
    'Name (for computers)': 'Nimi (konekielinen)',
    'Name (plural)': 'Nimi (monikossa)',
    'Description': 'Kuvaus',
    'Listable': 'Listattava',
    'Default layout': 'Oletusivupohja',
    // edit-app/src/popups/reusable-branch/SaveBlockAsReusableDialog.jsx
    'todo7': 'Tämä toiminto tallentaa sisällön uudelleenkäytettäväksi sisällöksi, jota voidaan myöhemmin helposti lisätä myös muihin sivuihin.',
    'Name': 'Nimi',
    'e.g. Text and image, Footer': 'esim. Teksti ja kuva, Footer',
    'Type': 'Tyyppi',
    'Duplicating': 'Monistuva',
    'todo12': 'Sisällöstä luodaan aina uusi kopio, kun se lisätään sivuun.',
    'Unique': 'Uniikki',
    'todo13': 'Sisältö viittaa samaan tietoon, vaikka se olisi usealla eri sivulla (esim. "Footer").',
    'Cancel': 'Peruuta',
    // edit-app/src/left-column/SaveButton.jsx
    'Undo latest change': 'Peruuta viimeisin muutos',
    'Save changes': 'Tallenna muutokset',
    // edit-app/src/right-column/WebPageIframe.js
    'Copy': 'Kopio',
    // edit-app/src/block-types/menu/EditForm.jsx
    'Add link': 'Lisää linkki',
    'Edit': 'Muokkaa',
    'Edit link': 'Muokkaa linkkiä',
    'Delete link': 'Poista linkki',
    // edit-app/src/block-types/menu/EditItemPanel.jsx
    'Link text': 'Linkin teksti',
    'Url': 'Urli',
    'e.g. %s or %s': 'esim. %s tai %s',
    // edit-app/src/block-types/menu/menu.js
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
    // edit-app/src/block-types/listing/AdditionalFiltersBuilder.jsx
    'which are': 'jotka on',
    'which is': 'joka on',
    'added to category': 'merkitty kategoriaan',
    '%s %s starts with': '%s %s alkaa kirjaimilla',
    'which#nominative': 'jotka',
    'which': 'joka',
    'whose': 'joiden',
    'which#genitive': 'jonka',
    'blog': 'blogi',
    'This value': 'Tämä arvo',
    'and': 'ja',
    'Delete filter': 'Poista filtteri',
    'Add filter': 'Lisää filtteri',
    // edit-app/src/block-types/listing/EditForm.jsx
    'List': 'Listaa',
    'all': 'kaikki',
    'single': 'yksi',
    'at most': 'enintään',
    'Type amount': 'Syötä lukumääärä',
    'ordered by': 'järjestäen ne',
    'newest to oldest': 'uusimmasta vanhimpaan',
    'oldest to newest': 'vanhimmasta uusimpaan',
    'randomly': 'satunnaisesti',
    'rendering %s using template': 'tulostaen %s templaatilla',
    'it': 'sen',
    'them': 'ne',
    'Add new %s': 'Lisää uusi %s',
    '%s must be a number': '%s tulisi olla numero',
    // edit-app/src/block-types/listing/listing.js
    'Listing': 'Listaus',
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
    // edit-app/src/block-widget/ImagePicker.jsx
    'Choose a picture': 'Valitse kuva',
    //edit-app/src/popups/upload/UploadButton.jsx
    'File name': 'Tiedostonimi',
    'Upload picture': 'Lataa kuva',
    'File extension not supported': 'Tiedostopääte ei kelpaa',
    'File size must not exceed %dMB': 'Tiedosto saa olla enintään %dMB',
    'Failed to upload image': 'Kuvan lataus epäonnistui',
    //edit-app/src/popups/upload/UploadsManager.jsx
    'Documents': 'Tiedostot',
    'Images': 'Kuvat',
    'Upload': 'Lataa',
    'Search': 'Hae',
    'No results for "%s"': 'Ei tuloksia hakusanalla "%s"',
    'No uploads yet': 'Ei vielä latauksia',
    // edit-app/src/right-column/website/WebsiteEditBasicInfoView.jsx
    'Edit website info': 'Muokkaa sivuston tietoja',
    'todo11': 'Nämä tiedot näkyvät hakukoneissa, ja esim. jaettaessa sivuja some-kanaviin.',
    'Language': 'Kieli',
    'Saved website\'s basic info.': 'Sivuston tiedot tallennettin.',
}, validationStrings);
