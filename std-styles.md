# Standard style units

"Standard" stylis/scss styles for each block type.

### \_\_body\_\_

```scss
// @exportAs(color)
--textDefault: #333;
// @exportAs(color)
--headingsDefault: #666;
```

### Listing

```scss
todo
```

### Menu

```scss
// @exportAs(option:none|circle|decimal|disc|disclosure-closed|disclosure-open|square)
--listStyleType_Menu_base1: none;
// @exportAs(length)
--gap_Menu_base1: 0.2rem;
// @exportAs(option:100%|0%|1)
--itemsWidth_Menu_base1: 100%;
// @exportAs(length)
--paddingTop_Menu_base1: 0rem;
// @exportAs(length)
--paddingRight_Menu_base1: 0rem;
// @exportAs(length)
--paddingBottom_Menu_base1: 0rem;
// @exportAs(length)
--paddingLeft_Menu_base1: 0rem;

padding-top: var(--paddingTop_Menu_base1);
padding-right: var(--paddingRight_Menu_base1);
padding-bottom: var(--paddingBottom_Menu_base1);
padding-left: var(--paddingLeft_Menu_base1);

ul {
  list-style-type: var(--listStyleType_Menu_base1);
  display: flex;
  gap: var(--gap_Menu_base1);
  flex-wrap: wrap;
  li {
    flex: 0 0 var(--itemsWidth_Menu_base1);
  }
}
```

### Button

```scss
// @exportAs(color)
--background_Button_base1: #1e717e;
// @exportAs(color)
--backgroundHover_Button_base1: #22808e;
// @exportAs(color)
--text_Button_base1: #fff;
// @exportAs(color)
--textHover_Button_base1: #fff;
// @exportAs(color)
--border_Button_base1: #1e717e;
// @exportAs(color)
--borderHover_Button_base1: #22808e;
// @exportAs(length)
--paddingTop_Button_base1: 0.25rem;
// @exportAs(length)
--paddingRight_Button_base1: 0.4rem;
// @exportAs(length)
--paddingBottom_Button_base1: 0.25rem;
// @exportAs(length)
--paddingLeft_Button_base1: 0.4rem;
// @exportAs(length)
--minWidth_Button_base1: 0%;

background: var(--background_Button_base1);
border: 1px solid var(--border_Button_base1);
color: var(--text_Button_base1);
transition: all .325s;
min-width: var(--minWidth_Button_base1);

&:hover {
  background: var(--backgroundHover_Button_base1);
  border: 1px solid var(--borderHover_Button_base1);
  color: var(--textHover_Button_base1);
}
```

### Code

```scss
todo
```

### Columns

```scss
// @exportAs(length)
--gap_Columns_base1: 0.4rem;
// @exportAs(option:normal|start|center|end|stretch|baseline|first baseline|last baseline|initial)
--alignItems_Columns_base1: initial;

gap: var(--gap_Columns_base1);
align-items: var(--alignItems_Columns_base1);
```

### Image

```scss
todo
```

### Section

```scss
// @exportAs(length)
--paddingTop_Section_base1: 0rem;
// @exportAs(length)
--paddingRight_Section_base1: 0rem;
// @exportAs(length)
--paddingBottom_Section_base1: 0rem;
// @exportAs(length)
--paddingLeft_Section_base1: 0rem;
// @exportAs(option:flex-start|center|flex-end|unset)
--alignItems_Section_base1: flex-end;
// @exportAs(length)
--minHeight_Section_base1: 12rem;
// @exportAs(color)
--cover_Section_base1: unset;

position: relative;
display: flex;
align-items: var(--alignItems_Section_base1);
min-height: var(--minHeight_Section_base1);

&:before {
  background-color: var(--cover_Section_base1);
  content: ""; height: 100%; width: 100%; position: absolute; left: 0; top: 0;
}
> * { position: relative; }

> div {
  padding: var(--paddingTop_Section_base1) var(--paddingRight_Section_base1) var(--paddingBottom_Section_base1) var(--paddingLeft_Section_base1);
  flex: 1 0 0;
}
```

### Text

```scss
// @exportAs(color)
--textNormal_Text_base1: initial;
// @exportAs(color)
--textHeadings_Text_base1: #4a677d;

color: var(--textNormal_Text_base1, var(--textDefault));

h1, h2, h3, h4, h5, h6 {
  color: var(--textHeadings_Text_base1, var(--headingsDefault));
}
```