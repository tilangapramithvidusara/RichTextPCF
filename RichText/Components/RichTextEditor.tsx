import React, { useState, useEffect, ClipboardEvent, useRef } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

import "../css/RichTextController.css";
import Editor from "./RichTextComponent";
import { loadResourceString } from "../apis/xrmRequests";
import { languageConstantsForCountry } from "../Constants/languageConstants";

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
  // const [copyNotAllowed, setCopyNotAllowed] = useState<string>("Copying questions is not allowed on this webpage");
  // const [apiNotSupport, setApiNotSupport] = useState<string>("Permissions API not supported")
  // const [grantPermission, setGrantPermission] = useState<string>("You need to grant permission to copy on this webpage")
  const [languageConstants, setLanguageConstants] = useState<any>(
    languageConstantsForCountry.en
  );

  const messageHandler = async () => {
    try {
      const languageConstantsFromResourceTable : any = await loadResourceString();
      if (languageConstantsFromResourceTable?.data && languageConstants?.length) {
        console.log("languageConstantsFromResTable 2", languageConstantsFromResourceTable);
        const refactorResourceTable = languageConstantsFromResourceTable?.data.reduce((result: any, currentObject: any) => {
          return Object.assign(result, currentObject);
        }, {});
        if (Object.keys(refactorResourceTable).length) {
          const originalConstants = languageConstants[0];
          const updatedValues = refactorResourceTable[0];
          for (const key in updatedValues) {
            if (key in updatedValues && key in originalConstants) {
              originalConstants[key] = updatedValues[key];
            }
          }
          setLanguageConstants(originalConstants);
        }
      }
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

  useEffect(() => {
    messageHandler();
    // retriveTemplateHandler();
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

  useEffect(() => {
    const handlePaste = async (event: any) => {
      type PermissionName = "geolocation" | "notifications" | "persistent-storage" | "push" | "screen-wake-lock" | "xr-spatial-tracking";
      type  MyPermissionName = PermissionName | 'clipboard-read' | 'clipboard-write';
      try {
        const permision: MyPermissionName = "clipboard-read";
        
        if (navigator.userAgent.includes("Safari/") && !(navigator.userAgent.includes("Chrome/") || navigator.userAgent.includes("Edge/"))) {
          event.preventDefault();
          await navigator.clipboard.writeText(languageConstants?.RichText_APIPermissionErrorMessage);
          await navigator.clipboard.writeText("");
        } else if (navigator.userAgent.includes("Firefox/")) {
          await navigator.clipboard.writeText(languageConstants?.RichText_APIPermissionErrorMessage);
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
                await navigator.clipboard.writeText(languageConstants?.RichText_CopyQuestionNotAllowed);
              }
            }
          } else {
            await navigator.clipboard.writeText(languageConstants?.RichText_GrantPermissionErrorMessage);
          }
        } else {
          await navigator.clipboard.writeText(languageConstants?.RichText_APIPermissionErrorMessage);
        }
      } catch (error) {
        console.error(error);
        await navigator.clipboard.writeText(languageConstants?.RichText_CopyQuestionNotAllowed);
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
