import React, { useState, useEffect, ClipboardEvent, useRef } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

import "../css/RichTextController.css";
import Editor from "./RichTextComponent";

declare global {
  interface Window {
    Xrm: any;
  }
}

interface EditorWithTabNavigationProps {
  nextElementId: string;
}

declare const navigator: any;

const RichTextEditor = ({ quill, context, container }: any) => {
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
            if (result.statuscode == 528670003 || result.statuscode == 528670005 || result.statuscode == 2) {
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

  // useEffect(() => {
  //   console.log('======ww=====> ', value);
  //   if (!value || (value == '')) {
  //     dataRetriveHandler();
  //   }
  // }, []);

  // useEffect(() => {
  //   messageHandler();
  //   retriveTemplateHandler();
  // }, []);

  useEffect(() => {
    const handleContextMenu = (event: any) => {
      event.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const handlePaste = async (event: any) => {
      type PermissionName = "geolocation" | "notifications" | "persistent-storage" | "push" | "screen-wake-lock" | "xr-spatial-tracking";
      type  MyPermissionName = PermissionName | 'clipboard-read' | 'clipboard-write';
      try {
        const permision: MyPermissionName = "clipboard-read";
        
        if (navigator.userAgent.includes("Safari/") && !(navigator.userAgent.includes("Chrome/") || navigator.userAgent.includes("Edge/"))) {
          event.preventDefault();
          await navigator.clipboard.writeText(apiNotSupport);
          await navigator.clipboard.writeText("");
        } else if (navigator.userAgent.includes("Firefox/")) {
          await navigator.clipboard.writeText(apiNotSupport);
        } else if (navigator?.permissions) {          
          // const permissionName = "clipboard-read" as PermissionName;
          const permissionStatus = await navigator.permissions.query({name: permision as PermissionName, allowWithoutGesture: false}); // allowWithoutGesture: false
          console.log('permissionStatus =================> ', permissionStatus);
          
          if (permissionStatus.state === "granted") { // permissionStatus.state === "granted" || permissionStatus.state === "prompt"
            let clipboardData = await navigator.clipboard.readText();

            let descriptionText = quillRef?.current?.editor?.getText();            

            if (descriptionText &&  descriptionText?.charCodeAt(0) !== 10) {
              clipboardData = clipboardData.toString().replace(/[^\x20-\x7E]/g, '');
              descriptionText = descriptionText.toString().replace(/[^\x20-\x7E]/g, '');
              console.log('condition ====> ', clipboardData.includes(descriptionText));

              if (clipboardData.includes(descriptionText)) {
                await navigator.clipboard.writeText(copyNotAllowed);
              }
            }
          } else {
            await navigator.clipboard.writeText(grantPermission);
          }
        } else {
          await navigator.clipboard.writeText(apiNotSupport);
        }
      } catch (error) {
        console.error(error);
        await navigator.clipboard.writeText(copyNotAllowed);
      }
    };

    document.addEventListener("copy", handlePaste);

    return () => {
      document.removeEventListener("copy", handlePaste);
    };
  }, []);

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

  const handleChange = (html: any) => {
    console.log("html", html);
    setValue(html);
    // window.parent.Xrm.Page.getAttribute("gyde_description").setValue(html);
  };

  // var FontAttributor = Quill.import('attributors/class/font');
  // FontAttributor.whitelist = [
  //   'sofia', 'slabo', 'roboto', 'inconsolata', 'ubuntu', 'courier_new', 'custom_font_1', 'custom_font_2'
  //   // Add your custom font families here
  // ];
  // Quill.register(FontAttributor, true);

  

  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ size: [] }],
      ["bold", "italic", "underline"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
    ],
    clipboard: { matchVisual: false },
  }

  // const editorRef = useRef<any | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    console.log('event key ====> ', event.key, event.shiftKey);
    
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      const newValue = value.slice(0, -1)
      console.log('vfv===> ', newValue, value)
      setValue(newValue);
      window.parent.Xrm.Page.getAttribute("gyde_description").setValue(newValue);
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
    <>
      <div
        className="exclude-copy"
        onCopy={(e: any) => preventCopyPaste(e)}
        onCut={(e: any) => preventCopyPaste(e)}
        onDragOver={dragOver}
        onDrop={drop}
        onDragStart={dragStart}
        onSelect={preventSelect}
      >
        <ReactQuill
          ref={quillRef}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          value={value}
          modules={modules}
          readOnly={isDisable}
          bounds=".app"
          id={"rich_text_editor_element"}
        />
      </div>
      {/* <Editor/> */}
    </>
  );
};

export default RichTextEditor;
