import { filterKeys } from "../Constants/filterKeys";

export const loadResourceString = async () => {

    const url = await window.parent.Xrm.Utility.getGlobalContext().getClientUrl();
    const language = await window.parent.Xrm.Utility.getGlobalContext().userSettings.languageId
    const webResourceUrl = `${url}/WebResources/gyde_localizedstrings.${language}.resx`;
    const languageKeyValueMapper: any = [];

    try {
      const response = await fetch(`${webResourceUrl}`);
      const data = await response.text();
      filterKeys?.map((filterKey: string, index: number) => {
        const parser = new DOMParser();
        // Parse the XML string
        const xmlDoc = parser.parseFromString(data, "text/xml");
        // Find the specific data element with the given key
        const dataNode: any = xmlDoc.querySelector(`data[name="${filterKey}"]`);
        // Extract the value from the data element
        const value: any = dataNode?.querySelector("value").textContent;
        if (index && value) {
            languageKeyValueMapper.push({ [filterKey]: value });
          }
        console.log('data updated ====> ',  index, value); 
      });
      return {
        error: false, data: languageKeyValueMapper
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }