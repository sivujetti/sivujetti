/*!
 * basic-site-bundled 0.6.0-dev
 * https://github.com/sivujetti/sivujetti
 * @license GPLv3
 */
!function(e){"use strict";const t=new class{constructor(e){this.strings=e||{}}addStrings(e){Object.assign(this.strings,e)}t(e,...t){const i=this.strings[e];return i?t?function(e,...t){const i=/(?:^|[^\\])%([a-z])/gi;let s,n,a=-1;for(;(s=i.exec(e))&&(n=t[++a]);)e=e.replace(`%${s[1]}`,n);return e}(i,...t):i:e}},i=t.t.bind(t),s={openPlaceholderPage(t,i="1"){const s=e.urlUtils.makeUrl(`/api/_placeholder-page/${t}/${i}`);this.getEl().contentWindow.location.href=s},goBack(){e.env.window.history.back()},getEl:()=>e.env.document.getElementById("sivujetti-site-iframe")};let n=null;class a extends preact.Component{render({block:e,Fff:t}){return preact.createElement("div",null,preact.createElement("p",null,i("A list of %s",e.listPageType),"."),t?preact.createElement(t,{block:e,parent:this}):null,preact.createElement("a",{href:"",onClick:this.openAddPageView.bind(this)},i("Add new %s",e.listPageType)))}openAddPageView(e){e.preventDefault();const t=this.props.block.listPageType,i=n.getPageTypes().find((({name:e})=>e===t));s.openPlaceholderPage(t,i.defaultLayoutId)}}var r;window.sivujetti.blockTypes.register("ServicesListing",(r={name:"ServicesListing",friendlyName:"Services list",defaultRenderer:"site:block-services-listing",initialData:{listPageType:"Services",listFilters:JSON.stringify([])}},n=r,t=>(function(e){const t=[];if("string"!=typeof e.name&&t.push("settings.name is required"),Object.prototype.hasOwnProperty.call(e,"friendlyName")&&"string"!=typeof e.friendlyName&&t.push("settings.friednlyName must be string"),"string"!=typeof e.defaultRenderer&&t.push("settings.defaultRenderer is required"),"object"!=typeof e.initialData)t.push("settings.initialData is required");else{Object.prototype.hasOwnProperty.call(e.initialData,"listPageType")&&"string"!=typeof e.initialData.listPageType&&t.push("settings.initialData.listPageType must be string");try{JSON.parse(e.initialData.listFilters)}catch(e){t.push("settings.initialData.listFilters must be valid json string")}}if(t.length)throw new Error(t.join("\n"))}(t),{name:t.name,friendlyName:t.friendlyName||t.name,ownPropNames:Object.keys(t.initialData),initialData:{listPageType:t.initialData.listPageType||"Pages",listFilters:t.initialData.listFilters},defaultRenderer:t.defaultRenderer,reRender:(t,i)=>e.http.post("/api/blocks/render",{block:t.toRaw()}).then((e=>e.result)),editForm:a,editFormProps:t.editFormProps||null})))}(sivujettiCommons);