import React, { useState, ClipboardEvent, useEffect, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'quill-mention';
import 'react-quill/dist/quill.snow.css';
import '../css/RichTextController.css';

declare global {
  interface Window {
    Xrm: any;
  }
}

declare const navigator: any;

var Font = Quill.import('formats/font');
// We do not add Aref Ruqaa since it is the default
Font.whitelist = ['segoe-ui', 'arial', 'roboto', 'raleway', 'montserrat', 'lato', 'rubik'];
Quill.register(Font, true);

var Size = Quill.import('formats/size');
Size.whitelist = [
  '9px',
  '10px',
  '11px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '26px',
  '28px'
];
Quill.register(Size, true);

// const Parchment = Quill.import('parchment');
// const boxAttributor = new Parchment.Attributor.Class('box', 'line', {
//   scope: Parchment.Scope.INLINE,
//   whitelist: ['solid', 'double', 'dotted']
// });
// Quill.register(boxAttributor);

const atValues = [
  { id: 0, value: 'barcode' },
  { id: 1, value: 'customername' },
  { id: 2, value: 'licensenumber' },
  { id: 3, value: 'netweight' },
  { id: 4, value: 'packageid' },
  { id: 5, value: 'price' },
  { id: 6, value: 'productname' },
  { id: 7, value: 'supplierid' }
];

const CustomToolbar = () => (
  <div id="toolbar">
    <select className="ql-font">
      {Font.whitelist.map((font: any, index: any) => (
        <option value={font} selected={!index}>
          {font[0].toUpperCase() + font.substr(1)}
        </option>
      ))}
    </select>
    <select className="ql-size">
      {Size.whitelist.map((size: any, index: any) => (
        <option value={size} selected={size.includes('14')}>
          {size}
        </option>
      ))}
    </select>
    <button className="ql-bold" />
    <button className="ql-italic" />
    <button className="ql-underline" />
    <button className="ql-align" value="" />
    <button className="ql-align" value="center" />
    <button className="ql-align" value="right" />
    <select className="ql-color">
      <option value="rgb(0, 0, 0)" />
      <option value="rgb(230, 0, 0)" />
      <option value="rgb(255, 153, 0)" />
      <option value="rgb(255, 255, 0)" />
      <option value="rgb(0, 138, 0)" />
      <option value="rgb(0, 102, 204)" />
      <option value="rgb(153, 51, 255)" />
      <option value="rgb(255, 255, 255)" />
      <option value="rgb(250, 204, 204)" />
      <option value="rgb(255, 235, 204)" />
      <option value="rgb(204, 224, 245)" />
      <option value="rgb(235, 214, 255)" />
      <option value="rgb(187, 187, 187)" />
      <option value="rgb(102, 185, 102)" />
    </select>
    <select className="ql-background">
      <option value="rgb(0, 0, 0)" />
      <option value="rgb(230, 0, 0)" />
      <option value="rgb(255, 153, 0)" />
      <option value="rgb(255, 255, 0)" />
      <option value="rgb(0, 138, 0)" />
      <option value="rgb(0, 102, 204)" />
      <option value="rgb(153, 51, 255)" />
      <option value="rgb(255, 255, 255)" />
      <option value="rgb(250, 204, 204)" />
      <option value="rgb(255, 235, 204)" />
      <option value="rgb(204, 224, 245)" />
      <option value="rgb(235, 214, 255)" />
      <option value="rgb(187, 187, 187)" />
      <option value="rgb(102, 185, 102)" />
    </select>
    <button className="ql-list" value="ordered"></button>
    <button className="ql-list" value="bullet"></button>
    {/* <span className="ql-formats">
      <button className="ql-list" value="bullet"></button>
    </span> */}
    {/* <select className="ql-box">
      <option selected>None</option>
      <option value="solid">Solid</option>
    </select> */}
  </div>
);

Editor.modules = {
  // [{ list: "ordered" }, { list: "bullet" }],
  toolbar: {
    container: '#toolbar'
  },
  mention: {
    allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
    mentionDenotationChars: ['@', '#'],
    source: function(searchTerm: any, renderList: any, mentionChar: any) {
      if (searchTerm.length === 0) {
        renderList(atValues, searchTerm);
      } else {
        const matches = [];
        for (let i = 0; i < atValues.length; i++)
          if (
            ~atValues[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())
          )
            matches.push(atValues[i]);
        renderList(matches, searchTerm);
      }
    },
    clipboard: {
      matchVisual: false
    }
    // list: function() {
    //   this.quill.format('list', !this.quill.getFormat().list);
    // }
  }
};

Editor.formats = [
  'bold',
  'underline',
  'italic',
  'font',
  'size',
  'align',
  'box',
  'mention',
  "color",
  "background",
  "list"
];

export default function Editor() {
  const [value, setValue] = useState("");
  const [isDisable, setIsDisable] = useState<boolean>(false);
  const quillRef = useRef<ReactQuill>(null);
  const [copyNotAllowed, setCopyNotAllowed] = useState<string>("Copying questions is not allowed on this webpage");
  const [apiNotSupport, setApiNotSupport] = useState<string>("Permissions API not supported")
  const [grantPermission, setGrantPermission] = useState<string>("You need to grant permission to copy on this webpage")

  const loadResourceString = async () => {

    const url = await window.parent.Xrm.Utility.getGlobalContext().getClientUrl();
    const language = await window.parent.Xrm.Utility.getGlobalContext().userSettings.languageId
    const webResourceUrl = `${url}/WebResources/gyde_localizedstrings.${language}.resx`;

    try {
      const response = await fetch(`${webResourceUrl}`);
      const data = await response.text();
      const filterKeys = ['copyingnotallowed', 'permissionapinotsupport', 'grantpermission']; // Replace with the key you want to filter
      filterKeys.map((filterKey: string, index: number) => {
        const parser = new DOMParser();
        // Parse the XML string
        const xmlDoc = parser.parseFromString(data, "text/xml");
        // Find the specific data element with the given key
        const dataNode: any = xmlDoc.querySelector(`data[name="${filterKey}"]`);
        // Extract the value from the data element
        const value: any = dataNode?.querySelector("value").textContent;

        if (index === 0) {
          setCopyNotAllowed(value)
        }
        if (index === 1) {
          setApiNotSupport(value)
        }
        if (index === 2) {
          setGrantPermission(value)
        }
        console.log('data ====> ',  index, value); 
      });
      // this.setState({ data });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  const messageHandler = async() => {
    try {
      await loadResourceString();
    } catch (error) {
      console.log('error ====>', error);
    }
  }

  const retriveTemplateHandler = async () => {
    try {
      var surveyTemplate = await window.parent.Xrm.Page.getAttribute("gyde_surveytemplate")?.getValue()[0]?.id?.replace("{", "")
      .replace("}", "");
      console.log('id ===> ', surveyTemplate);
      
      window.parent.Xrm.WebApi.retrieveRecord("gyde_surveytemplate", surveyTemplate, "?$select=statuscode").then(
        function success(result: any) {
            console.log("result status ====>", result.statuscode);
            if (result.statuscode == 528670003 || result.statuscode == 528670005) {
              setIsDisable(true)
            } else {
              setIsDisable(false);
            }
            // perform operations on record retrieval
        },
        function (error: any) {
            console.log("error message ====> ", error.message);
            setIsDisable(false);
            // handle error conditions
        }
      );
    } catch (error: any) {
      console.log("error22 message ====> ", error);
      setIsDisable(false);
    }
  }

  const dataRetriveHandler = async() => {
    try {
      const content = await window.parent.Xrm.Page.getAttribute("gyde_description").getValue();
      console.log('Content ====> ', content);
      setValue(content);
    } catch (error) {
      console.log('load error ===> ', error);
    }
  }

  useEffect(() => {
    console.log('======ww=====> ', value);
    if (!value || (value == '')) {
      dataRetriveHandler();
    }
  }, []);

  useEffect(() => {
    messageHandler();
    retriveTemplateHandler();
  }, []);

  useEffect(() => {
    const handleContextMenu = (event: any) => {
      event.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // useEffect(() => {
  //   const handlePaste = async (event: any) => {
  //     type PermissionName = "geolocation" | "notifications" | "persistent-storage" | "push" | "screen-wake-lock" | "xr-spatial-tracking";
  //     type  MyPermissionName = PermissionName | 'clipboard-read' | 'clipboard-write';
  //     try {
  //       const permision: MyPermissionName = "clipboard-read";
        
  //       if (navigator.userAgent.includes("Safari/") && !(navigator.userAgent.includes("Chrome/") || navigator.userAgent.includes("Edge/"))) {
  //         event.preventDefault();
  //         await navigator.clipboard.writeText(apiNotSupport);
  //         await navigator.clipboard.writeText("");
  //       } else if (navigator.userAgent.includes("Firefox/")) {
  //         await navigator.clipboard.writeText(apiNotSupport);
  //       } else if (navigator?.permissions) {          
  //         // const permissionName = "clipboard-read" as PermissionName;
  //         const permissionStatus = await navigator.permissions.query({name: permision as PermissionName, allowWithoutGesture: false}); // allowWithoutGesture: false
  //         console.log('permissionStatus =================> ', permissionStatus);
          
  //         if (permissionStatus.state === "granted") { // permissionStatus.state === "granted" || permissionStatus.state === "prompt"
  //           let clipboardData = await navigator.clipboard.readText();

  //           let descriptionText = quillRef?.current?.editor?.getText();            

  //           if (descriptionText &&  descriptionText?.charCodeAt(0) !== 10) {
  //             clipboardData = clipboardData.toString().replace(/[^\x20-\x7E]/g, '');
  //             descriptionText = descriptionText.toString().replace(/[^\x20-\x7E]/g, '');
  //             console.log('condition ====> ', clipboardData.includes(descriptionText));

  //             if (clipboardData.includes(descriptionText)) {
  //               await navigator.clipboard.writeText(copyNotAllowed);
  //             }
  //           }
  //         } else {
  //           await navigator.clipboard.writeText(grantPermission);
  //         }
  //       } else {
  //         await navigator.clipboard.writeText(apiNotSupport);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       await navigator.clipboard.writeText(copyNotAllowed);
  //     }
  //   };

  //   document.addEventListener("copy", handlePaste);

  //   return () => {
  //     document.removeEventListener("copy", handlePaste);
  //   };
  // }, []);

  function dragOver(ev: any) {
    ev.preventDefault();
  }

  function drop(ev: any) {
    ev.preventDefault();
  }

  function dragStart(ev: any) {
    ev.preventDefault();
  }

  const preventCopyPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    // notification.error({ message: "Copying disabled" });
  };

  const preventSelect = (event: any) => {
    event.preventDefalt();
  }

  // const handleChange = (html: any) => {
  //   console.log("html", html);
  //   setValue(html);
  //   window.parent.Xrm.Page.getAttribute("gyde_description").setValue(html);
  // };
  function replaceLastSelected(str: string, itemToReplace: string, replacement: any) {
    const lastIndex = str.lastIndexOf(itemToReplace);
    
    if (lastIndex !== -1) {
      const before = str.substring(0, lastIndex);
      const after = str.substring(lastIndex + itemToReplace.length);
      return before + replacement + after;
    }
    
    return str;
  }
  const handleChange = (html: any, delta: any, source: any, editor: any) => {
    let newHtml = html
    if (source == 'user') {
      // Check if Enter key was pressed      
      const lastDelta = delta?.ops[delta?.ops.length - 1];      

      if (lastDelta && lastDelta.insert === "\n") {
        const pattern = /<li><br><\/li>/g;

        // Use the match method to find all occurrences of the pattern
        const matches = html.match(pattern);

        // Count the number of matches
        const count = matches ? matches.length : 0;
        
        if (lastDelta?.attributes?.list && lastDelta?.attributes?.list === 'bullet' && count >= 1)
          html = replaceLastSelected(html, "</li><li><br></li>", '</li>')
        // html.replace("<li><br></li>", '')
        if (lastDelta?.attributes?.list && lastDelta?.attributes?.list === 'ordered' && count >= 1)
          html = replaceLastSelected(html, "</li><li><br></li>", '</li>')
        // html = html.replace("<li><br></li>", '')
      }
    }

    setTimeout(() => {
      setValue(html);
      window.parent.Xrm.Page.getAttribute("gyde_description").setValue(html);
    }, 50)
    // setValue(html);
    // window.parent.Xrm.Page.getAttribute("gyde_description").setValue(html);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    console.log('event key ====> ', event.key, event.shiftKey);
    
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();

      // const editor = editorRef.current?.getEditor();
      // const range = editor?.getSelection()?.index || 0;

      // Perform your logic to move the focus to the next element here
      const nextElementId: any = "gyde_helptext";
      const nextInputElement = window.parent.Xrm.Page.ui._formContext.getControl(nextElementId);
      console.log("nextInputElement =====> ", nextInputElement);
      
      if (nextInputElement) {
        nextInputElement.setFocus();
      }
    }
  };

  // useEffect(() => {
  //   container.addEventListener('keydown', handleKeyDown);

  //   return () => {
  //     container.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, []);

  return (
    <div 
      className="exclude-copy"
      onCopy={(e: any) => preventCopyPaste(e)}
      onCut={(e: any) => preventCopyPaste(e)}
      onDragOver={dragOver}
      onDrop={drop}
      onDragStart={dragStart}
      onSelect={preventSelect}
    >
    {/* <div className="text-editor"> */}
      <CustomToolbar/>
      <ReactQuill
        theme="snow"
        modules={Editor.modules}
        formats={Editor.formats}
        value={value}
        // style={{ height: '400px' }}
        id={"rich_text_editor_element"}
        // bounds=".app"
        // ref={quillRef}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        readOnly={isDisable}
      />
    {/* </div> */}
    </div>
  );
}
