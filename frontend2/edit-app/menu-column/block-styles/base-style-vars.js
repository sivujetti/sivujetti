import {__} from '@sivujetti-commons-for-edit-app';

const DEFAULT_FONT = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto';

export default [
// :root {
//   --spectre-dark-color: #303742;
    {
        varName: 'baseStyleDarkColor',
        cssProp: '--spectre-dark-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Dark',
            inputId: 'baseStyleDarkColor',
        },
    },
//   --spectre-light-color: #fff;
    {
        varName: 'baseStyleLightColor',
        cssProp: '--spectre-light-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Light',
            inputId: 'baseStyleLightColor',
        },
    },
//   /* Defaults #1 */
//   --spectre-primary-color: #2c86bb;
    {
        varName: 'baseStylePrimaryColor',
        cssProp: '--spectre-primary-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary',
            inputId: 'baseStylePrimaryColor',
        },
    },
//   --spectre-primary-color-dark: #297daf; /* darken(--spectre-primary-color, 3%), you can use http://scg.ar-ch.org/ for this */
    {
        varName: 'baseStylePrimaryColorDark',
        cssProp: '--spectre-primary-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary active',
            inputId: 'baseStylePrimaryColorDark',
        },
    },
//   --spectre-primary-color-light: #2f8fc7; /* lighten(--spectre-primary-color, 3%) */
    /* {
        varName: 'baseStylePrimaryColorLight',
        cssProp: '--spectre-primary-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary lighter',
            inputId: 'baseStylePrimaryColorLight',
        },
    }, */
//   --spectre-body-font-color: #303742; /* lighten(--spectre-dark-color, 5%) todo*/
    {
        varName: 'baseStyleBodyFontColor',
        cssProp: '--spectre-body-font-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Texts', // 'Body font',
            inputId: 'baseStyleBodyFontColor',
        },
    },
//   --spectre-link-color: #2c86bb; /* --spectre-primary-color */
    {
        varName: 'baseStyleLinkColor',
        cssProp: '--spectre-link-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links',
            inputId: 'baseStyleLinkColor',
        },
    },
//   --spectre-link-color-dark: #226892; /* darken(--spectre-link-color, 10%) */
    {
        varName: 'baseStyleLinkColorDark',
        cssProp: '--spectre-link-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links active',
            inputId: 'baseStyleLinkColorDark',
        },
    },
//   --spectre-link-color-light: #469fd4; /* lighten(--spectre-link-color, 10%) */
    {
        varName: 'baseStyleLinkColorLight',
        cssProp: '--spectre-link-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links visited',
            inputId: 'baseStyleLinkColorLight',
        },
    },
//   --spectre-base-font-family: "Domine", -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto; 
    {
        varName: 'baseStyleBaseFont',
        cssProp: '--spectre-base-font-family',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Default'), value: DEFAULT_FONT},
            ],
            label: 'Font',
            inputId: 'baseStyleBaseFont',
        },
    },
//   --spectre-font-size: 0.9rem;
    {
        varName: 'baseStyleFontSize',
        cssProp: '--spectre-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Font size',
            inputId: 'baseStyleFontSize',
        },
    },
//   --jet-headings-font-family: "Inter";
    {
        varName: 'baseStyleHeadingsFont',
        cssProp: '--jet-headings-font-family',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Default'), value: DEFAULT_FONT},
            ],
            label: 'Headings font',
            inputId: 'baseStyleHeadingsFont',
        },
    },
//   --jet-headings-font-weight: 700;
    {
        varName: 'baseStyleHeadingsFontWeight',
        cssProp: '--jet-headings-font-weight',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: '500', value: '500'},
                {label: '600', value: '600'},
                {label: '700', value: '700'},
                {label: '800', value: '800'},
                {label: '900', value: '900'},
                {label: __('Default'), value: '700'},
            ],
            label: 'Headings font weight',
            inputId: 'baseStyleHeadingsFontWeight',
        },
    },
//   --jet-headings-line-height: 2.4rem;
    /* {
        varName: 'baseStyleHeadingsLineHeight',
        cssProp: '--jet-headings-line-height',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Headings line height',
            inputId: 'baseStyleHeadingsLineHeight',
        },
    }, */
//   --jet-h1-font-size: 2.4rem;
    {
        varName: 'baseStyleHeadings1FontSize',
        cssProp: '--jet-h1-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h1 font size',
            inputId: 'baseStyleHeadings1FontSize',
        },
    },
//   --jet-h2-font-size: 1.8rem;
    {
        varName: 'baseStyleHeadings2FontSize',
        cssProp: '--jet-h2-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h2 font size',
            inputId: 'baseStyleHeadings2FontSize',
        },
    },
//   --jet-h3-font-size: 1.4rem;
    {
        varName: 'baseStyleHeadings3FontSize',
        cssProp: '--jet-h3-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h3 font size',
            inputId: 'baseStyleHeadings3FontSize',
        },
    },
//   --jet-h4-font-size: 1.2rem;
    {
        varName: 'baseStyleHeadings4FontSize',
        cssProp: '--jet-h4-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h4 font size',
            inputId: 'baseStyleHeadings4FontSize',
        },
    },
//   --jet-h5-font-size: 1rem;
    {
        varName: 'baseStyleHeadings5FontSize',
        cssProp: '--jet-h5-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h5 font size',
            inputId: 'baseStyleHeadings5FontSize',
        },
    },
//   --jet-h6-font-size: .8rem;
    {
        varName: 'baseStyleHeadings6FontSize',
        cssProp: '--jet-h6-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h6 font size',
            inputId: 'baseStyleHeadings6FontSize',
        },
    },
//   /* Buttons, button links */
//   --jet-buttons-bg-color-normal: #f8f8f8;
    {
        varName: 'baseStyleButtonsBgColorNormal',
        cssProp: '--jet-buttons-bg-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons background',
            inputId: 'baseStyleButtonsBgColorNormal',
        },
    },
//   --jet-buttons-bg-color-hover: $secondary-color;
    {
        varName: 'baseStyleButtonsBgColorHover',
        cssProp: '--jet-buttons-bg-color-hover',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons background hover',
            inputId: 'baseStyleButtonsBgColorHover',
        },
    },
//   --jet-buttons-color-normal: #333;
    {
        varName: 'baseStyleButtonsColorNormal',
        cssProp: '--jet-buttons-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons text',
            inputId: 'baseStyleButtonsColorNormal',
        },
    },
//   --jet-buttons-color-hover: #333;
    {
        varName: 'baseStyleButtonsColorHover',
        cssProp: '--jet-buttons-color-hover',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons text hover',
            inputId: 'baseStyleButtonsColorHover',
        },
    },
//   --jet-buttons-border-color-normal: #f8f8f8;
    {
        varName: 'baseStyleButtonsBorderColorNormal',
        cssProp: '--jet-buttons-border-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons border',
            inputId: 'baseStyleButtonsBorderColorNormal',
        },
    },
//   --jet-buttons-border-color-hover: $primary-color-dark;
    {
        varName: 'baseStyleButtonsBorderColorHover',
        cssProp: '--jet-buttons-border-color-hover',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons border hover',
            inputId: 'baseStyleButtonsBorderColorHover',
        },
    },
//   --jet-buttons-font-size: .85rem;
    {
        varName: 'baseStyleButtonsFontSize',
        cssProp: '--jet-buttons-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Buttons font size',
            inputId: 'baseStyleButtonsFontSize',
        },
    },
//   --jet-buttons-border-radius: 2px;
    {
        varName: 'baseStyleButtonsBorderRadius',
        cssProp: '--jet-buttons-border-radius',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Buttons border radius',
            inputId: 'baseStyleButtonsBorderRadius',
            defaultThemeValue: '2px',
        },
    },
//   --jet-buttons-border-width: 1px;
    {
        varName: 'baseStyleButtonsBorderWidth',
        cssProp: '--jet-buttons-border-width',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Buttons border width',
            inputId: 'baseStyleButtonsBorderWidth',
            defaultThemeValue: '1px',
        },
    },
//   /* Defaults #2 */
//   --spectre-secondary-color: #badbef; /* lighten(--spectre-primary-color, 38%) */
    {
        varName: 'baseStyleSecondaryColor',
        cssProp: '--spectre-secondary-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary',
            inputId: 'baseStyleSecondaryColor',
        },
    },
//   --spectre-secondary-color-dark: #aed5ec; /* darken(--spectre-secondary-color, 3%) */
    {
        varName: 'baseStyleSecondaryColorDark',
        cssProp: '--spectre-secondary-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary darker',
            inputId: 'baseStyleSecondaryColorDark',
        },
    },
//   --spectre-secondary-color-light: #c6e1f2; /* lighten(--spectre-primary-color, 3%) */
    {
        varName: 'baseStyleSecondaryColorLight',
        cssProp: '--spectre-secondary-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary lighter',
            inputId: 'baseStyleSecondaryColorLight',
        },
    },
//   --spectre-primary-shadow-color: #2c86bb33; /* rgba(0.2) */
    {
        varName: 'baseStylePrimaryShadow',
        cssProp: '--spectre-primary-shadow-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Shadow primary',
            inputId: 'baseStylePrimaryShadow',
        },
    },
//   --spectre-gray-color: #bcc3ce; /* lighten(--spectre-dark-color, 55%) */
    {
        varName: 'baseStyleGrayColor',
        cssProp: '--spectre-gray-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray',
            inputId: 'baseStyleGrayColor',
        },
    },
//   --spectre-gray-color-dark: #66748b; /* darken(--spectre-gray-color, 30%) */
    {
        varName: 'baseStyleGrayColorDark',
        cssProp: '--spectre-gray-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray darker',
            inputId: 'baseStyleGrayColorDark',
        },
    },
//   --spectre-gray-color-light: #f7f8f9; /* lighten(--spectre-gray-color, 20%) */
    {
        varName: 'baseStyleGrayColorLight',
        cssProp: '--spectre-gray-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray lighter',
            inputId: 'baseStyleGrayColorLight',
        },
    },
//   --spectre-border-color: #dadee4; /* lighten($dark-color, 65%) */
    {
        varName: 'baseStyleBorderColor',
        cssProp: '--spectre-border-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders',
            inputId: 'baseStyleBorderColor',
        },
    },
//   --spectre-border-color-dark: #bdc4ce; /* darken(--spectre-border-color, 10%) */
    {
        varName: 'baseStyleBorderColorDark',
        cssProp: '--spectre-border-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders darker',
            inputId: 'baseStyleBorderColorDark',
        },
    },
//   --spectre-border-color-light: #f2f3f5; /* lighten(--spectre-border-color, 8%) */
    {
        varName: 'baseStyleBorderColorLight',
        cssProp: '--spectre-border-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders lighter',
            inputId: 'baseStyleBorderColorLight',
        },
    },
//   --spectre-bg-color: #f7f8f9; /* lighten(--spectre-dark-color, 75%) */
    {
        varName: 'baseStyleBgColor',
        cssProp: '--spectre-bg-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Background (elements)',
            inputId: 'baseStyleBgColor',
        },
    },
//   --spectre-bg-color-dark: #eef0f2; /* darken(--spectre-bg-color, 3%) */
    {
        varName: 'baseStyleBgColorDark',
        cssProp: '--spectre-bg-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Background darker (elements)',
            inputId: 'baseStyleBgColorDark',
        },
    },
//   /* Forms */
    {
        varName: 'baseStyleInputsTextColor',
        cssProp: '--jet-inputs-text-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Inputs text',
            inputId: 'baseStyleInputsTextColor',
        },
    },
    {
        varName: 'baseStyleInputsBorderNormalColor',
        cssProp: '--jet-inputs-border-normal-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Inputs border',
            inputId: 'baseStyleInputsBorderNormalColor',
        },
    },
    {
        varName: 'baseStyleInputsBorderFocusColor',
        cssProp: '--jet-inputs-border-focus-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Inputs border focus',
            inputId: 'baseStyleInputsBorderFocusColor',
        },
    },
    {
        varName: 'baseStyleInputsBgNormalColor',
        cssProp: '--jet-inputs-bg-normal-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Inputs background',
            inputId: 'baseStyleInputsBgNormalColor',
        },
    },
    {
        varName: 'baseStyleInputsFontSize',
        cssProp: '--jet-inputs-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Inputs font size',
            inputId: 'baseStyleInputsFontSize',
        },
    },
    {
        varName: 'baseStyleInputsBorderWidth',
        cssProp: '--jet-inputs-border-width',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Inputs border width',
            inputId: 'baseStyleInputsBorderWidth',
            defaultThemeValue: '1px',
        },
    },
    {
        varName: 'baseStyleInputsBorderRadius',
        cssProp: '--jet-inputs-border-radius',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Inputs radius',
            inputId: 'baseStyleInputsBorderRadius',
            defaultThemeValue: '2px',
        },
    },
    {
        varName: 'baseStyleInputsCheckboxSelectedColor',
        cssProp: '--jet-inputs-checkbox-selected-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Inputs checkbox selected',
            inputId: 'baseStyleInputsCheckboxSelectedColor',
        },
    },
    {
        varName: 'baseStyleInputsFocusShadowColor',
        cssProp: '--jet-inputs-focus-shadow-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Inputs focus shadow',
            inputId: 'baseStyleInputsFocusShadowColor',
        },
    },
    {
        varName: 'baseStyleInputsPlaceholderColor',
        cssProp: '--jet-inputs-placeholder-color:',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Inputs placeholder text',
            inputId: 'baseStyleInputsPlaceholderColor',
        },
    },
    {
        varName: 'baseStyleInputsPaddingY',
        cssProp: '--jet-inputs-padding-y',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Inputs padding ↕',
            inputId: 'baseStyleInputsPaddingY',
            defaultThemeValue: '0.25rem',
        },
    },
    {
        varName: 'baseStyleInputsPaddingX',
        cssProp: '--jet-inputs-padding-x',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Inputs padding ↔',
            inputId: 'baseStyleInputsPaddingX',
            defaultThemeValue: '0.4rem',
        },
    },
// }
];

const essentialVarNames = [
    'baseStyleDarkColor',
    'baseStyleLightColor',
    'baseStylePrimaryColor',
    'baseStyleBodyFontColor',
    'baseStyleLinkColor',
    'baseStyleBaseFont',
    'baseStyleFontSize',
    'baseStyleHeadingsFont',

    'baseStyleButtonsBgColorNormal',
    'baseStyleButtonsColorNormal',
    'baseStyleButtonsBorderColorNormal',
    'baseStyleButtonsFontSize',
    'baseStyleButtonsBorderRadius',

    'baseStyleInputsTextColor',
    'baseStyleInputsBorderNormalColor',
    'baseStyleInputsBgNormalColor',
    'baseStyleInputsFontSize',
    'baseStyleInputsBorderRadius',
];

export {essentialVarNames};
