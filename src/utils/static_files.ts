/** Access files from `/static`. This impl. can be used both on node and in a browser */
export const staticFiles = {
  fetchFileText: async (path: string) => {
    const response = await fetch(path);
    return response.text();
  },
  fetchFileBlob: async (path: string) => {
    const response = await fetch(path);
    return response.blob();
  },
};
