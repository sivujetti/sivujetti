/*!
 * basic-site-bundled 0.8.0-dev
 * https://github.com/sivujetti/sivujetti
 * @license GPLv3
 */
!function(e){"use strict";const t={openPlaceholderPage(t,i="1"){const a=e.urlUtils.makeUrl(`/api/_placeholder-page/${t}/${i}`);this.getEl().contentWindow.location.href=a},goBack(){e.env.window.history.back()},getEl:()=>e.env.document.getElementById("sivujetti-site-iframe")};let i=null;class a extends preact.Component{render({block:t,Fff:i}){return preact.createElement("div",null,preact.createElement("p",null,e.__("A list of %s",t.listPageType),"."),i?preact.createElement(i,{block:t,parent:a}):null,preact.createElement("a",{href:"",onClick:this.openAddPageView.bind(this)},e.__("Add new %s",t.listPageType)))}openAddPageView(e){e.preventDefault();const a=this.props.block.listPageType,s=i.getPageTypes().find((({name:e})=>e===a));t.openPlaceholderPage(a,s.defaultLayoutId)}}var s;window.sivujetti.blockTypes.register("ServicesListing",(s={name:"ServicesListing",friendlyName:"Services list",defaultRenderer:"site:block-services-listing",initialData:{listPageType:"Services",listFilters:JSON.stringify([])}},i=s,t=>(function(e){const t=[];if("string"!=typeof e.name&&t.push("settings.name is required"),Object.prototype.hasOwnProperty.call(e,"friendlyName")&&"string"!=typeof e.friendlyName&&t.push("settings.friednlyName must be string"),"string"!=typeof e.defaultRenderer&&t.push("settings.defaultRenderer is required"),"object"!=typeof e.initialData)t.push("settings.initialData is required");else{Object.prototype.hasOwnProperty.call(e.initialData,"listPageType")&&"string"!=typeof e.initialData.listPageType&&t.push("settings.initialData.listPageType must be string");try{JSON.parse(e.initialData.listFilters)}catch(e){t.push("settings.initialData.listFilters must be valid json string")}}if(t.length)throw new Error(t.join("\n"))}(t),{name:t.name,friendlyName:t.friendlyName||t.name,ownPropNames:Object.keys(t.initialData),initialData:{listPageType:t.initialData.listPageType||"Pages",listFilters:t.initialData.listFilters},defaultRenderer:t.defaultRenderer,icon:t.icon||"layout-list",reRender:(t,i)=>e.http.post("/api/blocks/render",{block:t.toRaw()}).then((e=>e.result)),createSnapshot:e=>({listPageType:e.listPageType,listFilters:e.listFilters}),editForm:a,editFormProps:t.editFormProps||null})))}(sivujettiCommonsEditApp);
